#!/usr/bin/env bash
# Eval: DataProvider renders under vitest 2 + jsdom with default config.
# Pass = exit 0. Uses packages packed from this checkout, or a published
# version with DATA_CLIENT_VERSION=0.18.2 (fails: the original bug).
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
repo="$(git -C "$here" rev-parse --show-toplevel)"
work="$(mktemp -d)"
cp "$here/package.json" "$here/vite.config.js" "$here/provider.test.jsx" "$work"
cd "$work"
if [ -n "${DATA_CLIENT_VERSION:-}" ]; then
  npm pkg set "dependencies.@data-client/react=$DATA_CLIENT_VERSION"
else
  for p in normalizr core use-enhanced-reducer react; do
    (cd "$repo/packages/$p" && yarn pack -o "$work/$p.tgz" >/dev/null)
    npm pkg set "overrides.@data-client/$p=file:./$p.tgz"
  done
  npm pkg set "dependencies.@data-client/react=file:./react.tgz"
fi
npm install --legacy-peer-deps --no-audit --no-fund --loglevel=error
npx vitest run
