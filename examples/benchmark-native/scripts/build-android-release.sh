#!/usr/bin/env bash
# Authoritative release build: prepare BuildManifest → Gradle assembleRelease → sidecar.
# Split APKs are unsupported; requires single app-release.apk.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APK="${ROOT}/android/app/build/outputs/apk/release/app-release.apk"

echo "== prepare BuildManifest v1 =="
node "${ROOT}/scripts/build-manifest.cjs" prepare

echo "== gradle assembleRelease =="
(
  cd "${ROOT}/android"
  ./gradlew assembleRelease
)

if [[ ! -f "${APK}" ]]; then
  echo "error: expected single release APK at ${APK}" >&2
  echo "split / multi-APK installs are unsupported" >&2
  exit 1
fi

echo "== finalize sidecar =="
node "${ROOT}/scripts/build-manifest.cjs" finalize "${APK}"

echo "Release build complete: ${APK}"
echo "Sidecar: ${ROOT}/artifacts/build-sidecar.json"
