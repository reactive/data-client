#!/usr/bin/env bash
# Install/start a single release APK, pass scenario axes, pull report, verify provenance.
#
# Requires exactly one adb device unless ANDROID_SERIAL is set and valid.
# Split APKs unsupported. Sidecar (artifacts/build-sidecar.json) is authority —
# never the live checkout. Intent label is optional; commit is not authority.
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

# Clear previous report
"${ADB[@]}" shell "run-as ${APP_ID} rm -f files/gc-report.json" 2>/dev/null || true

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
  if "${ADB[@]}" shell "run-as ${APP_ID} ls files/gc-report.json" >/dev/null 2>&1; then
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

"${ADB[@]}" shell "run-as ${APP_ID} cat files/gc-report.json" > "${OUT}"
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
