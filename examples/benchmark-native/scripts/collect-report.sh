#!/usr/bin/env bash
# Install/start a single release APK, pass scenario axes, pull report, verify provenance.
#
# Requires exactly one adb device unless ANDROID_SERIAL is set and valid.
# Split APKs unsupported. Sidecar (artifacts/build-sidecar.json) is authority —
# never the live checkout. Intent label is optional; commit is not authority.
#
# Report I/O: the app writes app-specific external storage (externalFilesDir)
# and, on API 29+, a Downloads mirror. Collect uses adb pull / exec-out cat —
# never run-as (release is not debuggable).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=validate-config.sh
source "${ROOT}/scripts/validate-config.sh"

APP_ID="${APP_ID:-com.dataclient.benchmarknative}"
ACTIVITY="${ACTIVITY:-${APP_ID}/.MainActivity}"
APK="${APK:-${ROOT}/android/app/build/outputs/apk/release/app-release.apk}"
SIDECAR="${SIDECAR:-${ROOT}/artifacts/build-sidecar.json}"
OUT="${OUT:-${ROOT}/artifacts/gc-report.json}"
TIMEOUT_SEC="${TIMEOUT_SEC:-600}"

CANDIDATE_KIND="${CANDIDATE_KIND:-entity}"
PATTERN="${PATTERN:-unique}"
COUNT="${COUNT:-1000}"
CONTROL="${CONTROL:-gc}"
SAMPLES="${SAMPLES:-1}"
LABEL="${LABEL:-}"
INSTALL="${INSTALL:-1}"

# Validate axes before any install/device work.
validate_host_config "${CANDIDATE_KIND}" "${PATTERN}" "${COUNT}" "${CONTROL}" "${SAMPLES}"

mkdir -p "$(dirname "${OUT}")"

if ! command -v adb >/dev/null 2>&1; then
  echo "error: adb not found on PATH" >&2
  exit 1
fi

if [[ ! -f "${SIDECAR}" ]]; then
  echo "error: missing sidecar ${SIDECAR}" >&2
  echo "Build with: yarn workspace example-benchmark-native build:android:release" >&2
  exit 1
fi

if [[ ! -f "${APK}" ]]; then
  echo "error: APK not found at ${APK}" >&2
  echo "Split APKs are unsupported; need single app-release.apk" >&2
  exit 1
fi

if [[ "$(basename "${APK}")" != "app-release.apk" ]]; then
  echo "error: only single release APK app-release.apk is supported (got $(basename "${APK}"))" >&2
  exit 1
fi

# --- device selection ---
mapfile -t _DEVICES < <(adb devices | awk 'NR>1 && $2=="device" {print $1}')
if [[ -n "${ANDROID_SERIAL:-}" ]]; then
  FOUND=0
  for d in "${_DEVICES[@]:-}"; do
    if [[ "${d}" == "${ANDROID_SERIAL}" ]]; then
      FOUND=1
      break
    fi
  done
  if [[ "${FOUND}" != "1" ]]; then
    echo "error: ANDROID_SERIAL=${ANDROID_SERIAL} is not an eligible 'device'" >&2
    adb devices >&2 || true
    exit 1
  fi
  SERIAL="${ANDROID_SERIAL}"
else
  if [[ "${#_DEVICES[@]}" -ne 1 ]]; then
    echo "error: need exactly one eligible adb device (found ${#_DEVICES[@]}); set ANDROID_SERIAL" >&2
    adb devices >&2 || true
    exit 1
  fi
  SERIAL="${_DEVICES[0]}"
fi
ADB=(adb -s "${SERIAL}")
echo "Using device ${SERIAL}"

# adb-visible report paths. Release APKs are not debuggable, so run-as cannot
# read private filesDir. Prefer the Downloads mirror on Android 10+ user builds
# (shell often cannot read /Android/data/<id>/).
REPORT_NAME="gc-report.json"
PUBLIC_REPORT_NAME="dataclient-gc-report.json"
DEVICE_REPORT_APP="/sdcard/Android/data/${APP_ID}/files/${REPORT_NAME}"
DEVICE_REPORT_APP_EMU="/storage/emulated/0/Android/data/${APP_ID}/files/${REPORT_NAME}"
DEVICE_REPORT_PUBLIC="/sdcard/Download/${PUBLIC_REPORT_NAME}"
DEVICE_REPORT_PUBLIC_EMU="/storage/emulated/0/Download/${PUBLIC_REPORT_NAME}"

clear_device_reports() {
  "${ADB[@]}" shell "rm -f \
    '${DEVICE_REPORT_APP}' \
    '${DEVICE_REPORT_APP_EMU}' \
    '${DEVICE_REPORT_PUBLIC}' \
    '${DEVICE_REPORT_PUBLIC_EMU}'" >/dev/null 2>&1 || true
}

device_report_ready() {
  local p
  for p in \
    "${DEVICE_REPORT_PUBLIC}" \
    "${DEVICE_REPORT_PUBLIC_EMU}" \
    "${DEVICE_REPORT_APP}" \
    "${DEVICE_REPORT_APP_EMU}"; do
    if "${ADB[@]}" shell "test -s '${p}'" >/dev/null 2>&1; then
      return 0
    fi
  done
  return 1
}

extract_logcat_report_path() {
  local line
  line="$("${ADB[@]}" logcat -d -s BenchNative:I | tr -d '\r' | grep 'REPORT_READY' | tail -n 1 || true)"
  if [[ -z "${line}" ]]; then
    return 1
  fi
  if [[ "${line}" =~ pull=([^[:space:]]+) ]]; then
    printf '%s\n' "${BASH_REMATCH[1]}"
    return 0
  fi
  if [[ "${line}" =~ path=([^[:space:]]+) ]]; then
    printf '%s\n' "${BASH_REMATCH[1]}"
    return 0
  fi
  return 1
}

pull_device_report() {
  local candidates=()
  local from_log src
  from_log="$(extract_logcat_report_path || true)"
  if [[ -n "${from_log}" ]]; then
    candidates+=("${from_log}")
  fi
  candidates+=(
    "${DEVICE_REPORT_PUBLIC}"
    "${DEVICE_REPORT_PUBLIC_EMU}"
    "${DEVICE_REPORT_APP}"
    "${DEVICE_REPORT_APP_EMU}"
  )
  for src in "${candidates[@]}"; do
    rm -f "${OUT}"
    if "${ADB[@]}" pull "${src}" "${OUT}" >/dev/null 2>&1 && [[ -s "${OUT}" ]]; then
      echo "Pulled ${src} → ${OUT}"
      return 0
    fi
    if "${ADB[@]}" exec-out cat "${src}" > "${OUT}" 2>/dev/null && [[ -s "${OUT}" ]]; then
      echo "Read ${src} → ${OUT}"
      return 0
    fi
  done
  return 1
}

# --- provenance: local APK must match sidecar (authority) ---
node -e '
const fs=require("fs");
const { verifySidecarIdentity } = require(process.argv[2]);
const sidecar=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
if (sidecar.schemaVersion!==1) { console.error("bad sidecar schema"); process.exit(2); }
verifySidecarIdentity(sidecar);
console.log("sidecar identity verified buildId="+sidecar.buildId+" sidecarId="+sidecar.sidecarId);
' "${SIDECAR}" "${ROOT}/scripts/build-identity.cjs"

SIDECAR_BUILD_ID="$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).buildId)' "${SIDECAR}")"
SIDECAR_DIGEST="$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).sourceDigest)' "${SIDECAR}")"
SIDECAR_APK_SHA="$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).apkSha256)' "${SIDECAR}")"
SIDECAR_ID="$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).sidecarId)' "${SIDECAR}")"

LOCAL_APK_SHA="$(node "${ROOT}/scripts/build-manifest.cjs" hash "${APK}")"
if [[ "${LOCAL_APK_SHA}" != "${SIDECAR_APK_SHA}" ]]; then
  echo "error: local APK sha256 ${LOCAL_APK_SHA} != sidecar ${SIDECAR_APK_SHA} (stale artifact)" >&2
  exit 1
fi

CURRENT_DIGEST="$(node "${ROOT}/scripts/build-manifest.cjs" digest)"
if [[ "${CURRENT_DIGEST}" != "${SIDECAR_DIGEST}" ]]; then
  echo "error: current sourceDigest ${CURRENT_DIGEST} != sidecar ${SIDECAR_DIGEST}" >&2
  echo "Rebuild with yarn workspace example-benchmark-native build:android:release" >&2
  exit 1
fi

if [[ "${INSTALL}" == "1" ]]; then
  echo "Installing single APK ${APK}…"
  "${ADB[@]}" install -r "${APK}"
fi

# Hash the installed base APK (stream via adb exec-out / pull path).
TMP_INSTALLED="$(mktemp)"
cleanup() { rm -f "${TMP_INSTALLED}"; }
trap cleanup EXIT

# Prefer `pm path` → pull the single base APK.
INSTALLED_PATH="$("${ADB[@]}" shell pm path "${APP_ID}" | tr -d '\r' | awk -F: '/^package:/{print $2; exit}')"
if [[ -z "${INSTALLED_PATH}" ]]; then
  echo "error: could not resolve installed package path for ${APP_ID}" >&2
  exit 1
fi
PATH_COUNT="$("${ADB[@]}" shell pm path "${APP_ID}" | tr -d '\r' | grep -c '^package:' || true)"
if [[ "${PATH_COUNT}" -ne 1 ]]; then
  echo "error: expected exactly one installed APK path (split APKs unsupported); got ${PATH_COUNT}" >&2
  "${ADB[@]}" shell pm path "${APP_ID}" >&2 || true
  exit 1
fi

"${ADB[@]}" pull "${INSTALLED_PATH}" "${TMP_INSTALLED}" >/dev/null
INSTALLED_SHA="$(node "${ROOT}/scripts/build-manifest.cjs" hash "${TMP_INSTALLED}")"
if [[ "${INSTALLED_SHA}" != "${SIDECAR_APK_SHA}" ]]; then
  echo "error: installed APK sha256 ${INSTALLED_SHA} != sidecar ${SIDECAR_APK_SHA}" >&2
  exit 1
fi
echo "installedApkSha256=${INSTALLED_SHA}"

# Clear previous report (externalFilesDir + Downloads mirror; no run-as)
clear_device_reports

echo "Starting ${ACTIVITY} with axes ${CANDIDATE_KIND}/${PATTERN}/${COUNT}/interaction/${CONTROL}…"
"${ADB[@]}" logcat -c || true
"${ADB[@]}" shell am force-stop "${APP_ID}" || true

START_ARGS=(
  am start -n "${ACTIVITY}"
  --ez autoRun true
  --es candidateKind "${CANDIDATE_KIND}"
  --es pattern "${PATTERN}"
  --ei count "${COUNT}"
  --es control "${CONTROL}"
  --ei samples "${SAMPLES}"
)
if [[ -n "${LABEL}" ]]; then
  START_ARGS+=(--es label "${LABEL}")
fi
"${ADB[@]}" shell "${START_ARGS[@]}"

echo "Waiting for REPORT_READY (timeout ${TIMEOUT_SEC}s)…"
deadline=$((SECONDS + TIMEOUT_SEC))
found=0
while (( SECONDS < deadline )); do
  if "${ADB[@]}" logcat -d -s BenchNative:I | grep -q 'REPORT_READY'; then
    found=1
    break
  fi
  if device_report_ready; then
    found=1
    break
  fi
  sleep 2
done

if [[ "${found}" != "1" ]]; then
  echo "error: timed out waiting for report" >&2
  "${ADB[@]}" logcat -d -s BenchNative:I ReactNativeJS:E AndroidRuntime:E | tail -n 80 >&2 || true
  exit 1
fi

if ! pull_device_report; then
  echo "error: REPORT_READY seen but adb could not pull the report" >&2
  echo "tried Downloads mirror and Android/data/${APP_ID}/files/${REPORT_NAME}" >&2
  "${ADB[@]}" logcat -d -s BenchNative:I | grep 'REPORT_READY' | tail -n 5 >&2 || true
  exit 1
fi
echo "Wrote ${OUT}"

# Verify embedded buildId matches sidecar; attach sidecar provenance + installed hash.
node -e '
const fs=require("fs");
const out=process.argv[1], sidecarPath=process.argv[2], installedSha=process.argv[3];
const report=JSON.parse(fs.readFileSync(out,"utf8"));
const sidecar=JSON.parse(fs.readFileSync(sidecarPath,"utf8"));
const embedded=report.build && report.build.buildId;
if (!embedded || embedded !== sidecar.buildId) {
  console.error("error: report buildId", embedded, "!= sidecar", sidecar.buildId);
  process.exit(1);
}
report.build = report.build || {};
report.build.sidecar = {
  buildId: sidecar.buildId,
  sourceDigest: sidecar.sourceDigest,
  apkSha256: sidecar.apkSha256,
  apkPath: sidecar.apkPath,
  sidecarId: sidecar.sidecarId,
};
report.build.installedApkSha256 = installedSha;
report.build.apkSizeBytes = sidecar.apkSizeBytes;
fs.writeFileSync(out, JSON.stringify(report, null, 2));
console.log("provenance ok buildId="+sidecar.buildId+" sidecarId="+sidecar.sidecarId);
' "${OUT}" "${SIDECAR}" "${INSTALLED_SHA}"

echo "Done."
