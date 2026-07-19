# Release-Hermes Android GC benchmark

Private monorepo workspace `example-benchmark-native`: Android-only React Native **0.86** app (React **19.2.3**, Hermes enabled). Measures `@data-client/core` cache GC interaction cost on a physical device in a **release** build.

This phase is **manual**, not CI. Emulators are functional checks only — not authoritative.

**APK shape:** only a **single** universal release APK (`app-release.apk`) is supported. Split / multi-APK installs are rejected by the collect script.

## Prerequisites

- Node `>= 22.11`, Yarn 4 (repo root)
- JDK compatible with the RN 0.86 Android Gradle Plugin
- Android SDK (`ANDROID_HOME`), platform tools (`adb`), and exactly one device (or set `ANDROID_SERIAL`)
- Built `@data-client/core`
- Physical mid-range Android device for authoritative runs

## Install / build

Authoritative release path (prepare BuildManifest → Gradle → sidecar):

```bash
yarn install
yarn workspace @data-client/core run build:lib
yarn workspace example-benchmark-native typecheck
yarn workspace example-benchmark-native lint
yarn workspace example-benchmark-native test
yarn workspace example-benchmark-native build:android:release
```

This writes:

- embedded asset `android/app/src/main/assets/build-manifest.json` (generated; gitignored)
- `android/app/build/outputs/apk/release/app-release.apk`
- `artifacts/build-sidecar.json` (APK sha256 + buildId; **collection authority**)

## Provenance

- **`buildId`** — source-build identity: deterministic `sha256` over `schemaVersion`, `gitCommit`, `gitDirty`, `sourceDigest` (not APK bytes, not timestamps).
- **`apkSha256`** — artifact identity: hash of the single `app-release.apk` bytes (sidecar + installed APK must match).
- **`sidecarId`** — artifact-aware: `sha256(buildId ∥ apkSha256)`.
- **Sidecar is authority**, not the live checkout. Collection verifies sidecar identity, source digest, local + installed APK sha256, and report embedded `buildId`.
- Intent `label` is optional metadata only. Commit is fingerprinting input to `buildId`, not a separate launch authority.
- Tampered metadata or a forged `buildId` fails `verifyManifestBuildId` / collect.

## Scenario IDs

`android/{entity|endpoint|mixed}/{unique|duplicate}/{1000|10000|100000}/interaction/{gc|no-gc}`

- `duplicate` is entity-only; invalid axes fail validation (host + in-app)

## Host collection

```bash
# exactly one device, or:
# ANDROID_SERIAL=… CANDIDATE_KIND=entity …
CANDIDATE_KIND=entity PATTERN=unique COUNT=1000 CONTROL=gc SAMPLES=5 \
  yarn workspace example-benchmark-native collect
```

Authoritative **100k**:

```bash
CANDIDATE_KIND=entity PATTERN=unique COUNT=100000 CONTROL=gc SAMPLES=5 \
  yarn workspace example-benchmark-native collect
CANDIDATE_KIND=entity PATTERN=unique COUNT=100000 CONTROL=no-gc SAMPLES=5 \
  yarn workspace example-benchmark-native collect
```

### Matrix

Full canonical matrix via loops; 100k skipped unless `FULL=1` or filter selects them.

```bash
SAMPLES=3 yarn workspace example-benchmark-native matrix
SAMPLES=5 yarn workspace example-benchmark-native matrix entity/unique/100000
FULL=1 SAMPLES=5 yarn workspace example-benchmark-native matrix
```

## UI frame semantics

| Source | Quantity | Missed-frame math |
| --- | --- | --- |
| FrameMetrics | `TOTAL_DURATION` (duration) | `max(0, ceil(duration/period) − 1)` |
| Choreographer | frame-time delta (interval) | `max(0, round(interval/period) − 1)` |
| JS rAF | timestamp intervals | same as Choreographer |

Every sample records `uiCaptureSource`, frame count, max/total duration aggregates, missed frames, and refresh period/rate. Zero frames or invalid refresh period fail the run. Capture stop is idempotent; JS tears down in `finally`.

## Memory caveat

Without forced Hermes GC, JS heap and process PSS/RSS are observational/noisy — not a memory gate alone. Compare repeated `gc` vs `no-gc`. No `System.gc()`.

## Verification without a device

```bash
bash -n scripts/*.sh
yarn workspace example-benchmark-native test
yarn workspace example-benchmark-native typecheck
```

On-device install/start/pull remains unverified until a device is attached.
