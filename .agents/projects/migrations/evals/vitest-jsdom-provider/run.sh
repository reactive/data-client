#!/usr/bin/env bash
# Eval: DataProvider renders under vitest 2 + jsdom with default config.
# Pass = exit 0. Builds and packs the packages from this checkout, or installs a
# published version with DATA_CLIENT_VERSION=0.18.2 (fails: the original bug).
# SKIP_BUILD=1 packs the current build output without rebuilding.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
repo="$(git -C "$here" rev-parse --show-toplevel)"
# The repo's pinned yarn, so corepack needn't download it
yarn() { node "$repo/.yarn/releases/$(ls "$repo/.yarn/releases" | head -1)" "$@"; }
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
cp "$here/package.json" "$here/vite.config.js" "$here/provider.test.jsx" "$work"
if [ -n "${DATA_CLIENT_VERSION:-}" ]; then
  (cd "$work" && npm pkg set "dependencies.@data-client/react=$DATA_CLIENT_VERSION")
else
  if [ -z "${SKIP_BUILD:-}" ]; then
    (cd "$repo" && yarn build:types && yarn workspaces foreach -Rpti --from @data-client/react run build) >/dev/null
  fi
  for p in normalizr core use-enhanced-reducer react; do
    (cd "$repo/packages/$p" && yarn pack -o "$work/$p.tgz" >/dev/null)
    (cd "$work" && npm pkg set "overrides.@data-client/$p=file:./$p.tgz")
  done
  (cd "$work" && npm pkg set "dependencies.@data-client/react=file:./react.tgz")
fi
cd "$work"
npm install --legacy-peer-deps --no-audit --no-fund --loglevel=error
npx vitest run
