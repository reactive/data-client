#!/usr/bin/env bash
# Eval: package subpaths share code with the root entry under Node. See README.md.
set -uo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
repo="$(git -C "$here" rev-parse --show-toplevel)"
# The repo's pinned yarn, run directly so corepack needn't download it
yarn_bin="$repo/$(sed -n 's/^yarnPath: //p' "$repo/.yarnrc.yml")"
repo_yarn() { node "$yarn_bin" "$@"; }
log="$(mktemp)"
trap 'rm -f "$log"' EXIT
cd "$repo"

# yarn pack's prepack builds each package's JavaScript, not the types
if [ -z "${SKIP_BUILD:-}" ] && ! repo_yarn build:types >"$log" 2>&1; then
  tail -40 "$log"
  echo "Type build failed: this is not the eval's result" >&2
  exit 2
fi
# Stale chunks from earlier builds would be packed too
rm -rf packages/core/dist packages/react/dist packages/rest/dist
repo_yarn check:package-exports >"$log" 2>&1
work="$repo/node_modules/.cache/check-package-exports"
# yarn pack failing is the one way the check stops before any package
if grep -q '^yarn pack failed' "$log"; then
  tail -40 "$log"
  echo "Packing failed: this is not the eval's result" >&2
  exit 2
fi
# The check's other results belong to other evals; this one reads `shared`.
# Prints each package's `shared` line, and the reasons under a failed one.
echo "check:package-exports 'shared' results:"
awk '/^@data-client\//{pkg = $0 ": "} /^  [^ ]/{p = / shared$/; if (p) print pkg $0} p && /^    /' "$log"
packages=$(grep -c '^@data-client/' "$log")
passed=$(grep -c '✓ shared$' "$log")
expected=$(cd "$repo" && repo_yarn workspaces list --no-private --json | wc -l)
shared_failed=0
if [ "$packages" -ne "$expected" ] || [ "$passed" -ne "$expected" ]; then
  shared_failed=1
  # a crash stops the check before every package reports
  [ "$packages" -ne "$expected" ] && tail -20 "$log"
  echo "shared passed for $passed of $expected packages" >&2
fi

cp "$here/probe.mjs" "$work/shared-instances-probe.mjs"
node "$work/shared-instances-probe.mjs"
probe=$?
[ "$shared_failed" -eq 0 ] && [ "$probe" -eq 0 ] || exit 1
