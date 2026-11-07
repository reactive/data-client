#!/usr/bin/env bash
# Eval: DataProvider renders under vitest 2 + jsdom with default config. See README.md.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
repo="$(git -C "$here" rev-parse --show-toplevel)"
# The repo's pinned yarn, run directly so corepack needn't download it
yarn_bin="$repo/$(sed -n 's/^yarnPath: //p' "$repo/.yarnrc.yml")"
repo_yarn() { node "$yarn_bin" "$@"; }
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
cp "$here/package.json" "$here/vite.config.js" "$here/provider.test.jsx" "$work"

setup() {
  if [ -n "${DATA_CLIENT_VERSION:-}" ]; then
    (cd "$work" && npm pkg set "dependencies.@data-client/react=$DATA_CLIENT_VERSION")
  else
    # yarn pack's prepack builds core, use-enhanced-reducer and react, and their
    # bundles need the types. normalizr has no prepack, so build it here.
    if [ -z "${SKIP_BUILD:-}" ]; then
      (cd "$repo" && repo_yarn build:types && repo_yarn workspace @data-client/normalizr run build)
    fi
    local deps=("dependencies.@data-client/react=file:./react.tgz")
    for p in normalizr core use-enhanced-reducer react; do
      (cd "$repo/packages/$p" && repo_yarn pack -o "$work/$p.tgz")
      [ "$p" = react ] || deps+=("overrides.@data-client/$p=file:./$p.tgz")
    done
    (cd "$work" && npm pkg set "${deps[@]}")
  fi
  (cd "$work" && npm install --no-audit --no-fund --loglevel=error)
}

# errexit is ignored inside `if`/`||`, so check the subshell's status instead
set +e
(set -e; setup) >"$work/setup.log" 2>&1
status=$?
set -e
if [ "$status" -ne 0 ]; then
  tail -40 "$work/setup.log"
  echo "Setup (build, pack or install) failed: this is not the eval's result" >&2
  exit 2
fi
cd "$work"
npx vitest run
