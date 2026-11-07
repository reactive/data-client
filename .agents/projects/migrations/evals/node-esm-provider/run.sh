#!/usr/bin/env bash
# Eval: DataProvider renders when Node loads @data-client/react's ESM build. See README.md.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
repo="$(git -C "$here" rev-parse --show-toplevel)"
# The repo's pinned yarn, run directly so corepack needn't download it
yarn_bin="$repo/$(sed -n 's/^yarnPath: //p' "$repo/.yarnrc.yml")"
repo_yarn() { node "$yarn_bin" "$@"; }
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
cp "$here/package.json" "$here/provider.mjs" "$work"

setup() {
  if [ -n "${DATA_CLIENT_VERSION:-}" ]; then
    (cd "$work" && npm pkg set "dependencies.@data-client/react=$DATA_CLIENT_VERSION")
  else
    # yarn pack's prepack builds each package's JavaScript, and the bundles
    # need the types, which it doesn't build
    if [ -z "${SKIP_BUILD:-}" ]; then
      (cd "$repo" && repo_yarn build:types)
    fi
    local deps=("dependencies.@data-client/react=file:./react.tgz")
    # Dependencies first: core and react bundle their dependencies' lib/
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
node --conditions=module provider.mjs
