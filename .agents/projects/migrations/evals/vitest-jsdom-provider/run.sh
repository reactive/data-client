#!/usr/bin/env bash
# Eval: DataProvider renders under vitest 2 + jsdom with default config.
# Pass = exit 0. Builds and packs the packages from this checkout, or installs a
# published version with DATA_CLIENT_VERSION=0.18.2 (fails: the original bug).
# SKIP_BUILD=1 packs the current build output without rebuilding.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
repo="$(git -C "$here" rev-parse --show-toplevel)"
# Run the repo's pinned yarn directly, so corepack needn't download it
yarn_bin="$repo/.yarn/releases/yarn-$(node -p "require('$repo/package.json').packageManager.split('@')[1]").cjs"
repo_yarn() { node "$yarn_bin" "$@"; }
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
cp "$here/package.json" "$here/vite.config.js" "$here/provider.test.jsx" "$work"
if [ -n "${DATA_CLIENT_VERSION:-}" ]; then
  (cd "$work" && npm pkg set "dependencies.@data-client/react=$DATA_CLIENT_VERSION")
else
  if [ -z "${SKIP_BUILD:-}" ]; then
    if ! (cd "$repo" && repo_yarn build:types && repo_yarn workspaces foreach -Rpti --from @data-client/react run build) >"$work/build.log" 2>&1; then
      tail -40 "$work/build.log"
      echo "Build failed: this is not the eval's result" >&2
      exit 2
    fi
  fi
  for p in normalizr core use-enhanced-reducer react; do
    (cd "$repo/packages/$p" && repo_yarn pack -o "$work/$p.tgz" >/dev/null)
    (cd "$work" && npm pkg set "overrides.@data-client/$p=file:./$p.tgz")
  done
  (cd "$work" && npm pkg set "dependencies.@data-client/react=file:./react.tgz")
fi
cd "$work"
npm install --no-audit --no-fund --loglevel=error
npx vitest run
