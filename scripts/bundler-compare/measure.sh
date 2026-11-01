#!/usr/bin/env bash
# Gzipped and brotli JS of a two-page app (one lazy chunk per page) built from this checkout's packages
# with one bundler per family: rspack (webpack), Vite 8 (Rolldown, Rollup) and Next.js Turbopack.
#
#   ./measure.sh [label]            build packages, then measure; saves results/<label>.txt
#   ./measure.sh --no-build [label] reuse packages/*/lib as built
#   ./measure.sh --compare A B      print B - A per bundler
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
repo=$(git -C "$here" rev-parse --show-toplevel)
mkdir -p "$here/results"

if [ "${1:-}" = --compare ]; then
  if ! cmp -s "$here/results/$2.versions" "$here/results/$3.versions"; then
    echo "warning: $2 and $3 used different bundler versions:"
    paste "$here/results/$2.versions" "$here/results/$3.versions"
  fi
  join <(sort "$here/results/$2.txt") <(sort "$here/results/$3.txt") |
    awk -v a="$2" -v b="$3" 'BEGIN { printf "%-16s %10s %10s %7s\n", "bundler", a, b, "diff" }
      { printf "%-16s %10d %10d %+7d\n", $1, $2, $3, $3 - $2 }'
  exit
fi

build=1
if [ "${1:-}" = --no-build ]; then build=0; shift; fi
label=${1:-$(git -C "$repo" describe --always --dirty --exclude='*')}
# reinstall when the lockfile changed since the last install
[ "$here/node_modules/.package-lock.json" -nt "$here/package-lock.json" ] || (cd "$here" && npm ci)

if [ $build = 1 ]; then
  (cd "$repo" && yarn workspaces foreach -Wpti --no-private run build:lib >"$here/results/build.log" 2>&1) ||
    { tail -20 "$here/results/build.log"; exit 1; }
fi

# install this checkout's packages as if from npm
dst=$here/node_modules/@data-client
rm -rf "$dst" && mkdir -p "$dst"
for p in core endpoint normalizr react rest use-enhanced-reducer; do
  mkdir -p "$dst/$p"
  cp "$repo/packages/$p/package.json" "$dst/$p/"
  cp -r "$repo/packages/$p/lib" "$dst/$p/"
done
find "$dst" -path '*/lib/*' -name index.js -exec node "$here/strip-hasown.mjs" {} +

bin=$here/node_modules/.bin
cd "$here/app"
"$bin/rspack" build -c rspack.config.mjs >/dev/null
"$bin/vite" build >/dev/null
(cd next && rm -rf .next && NEXT_TELEMETRY_DISABLED=1 "$bin/next" build --turbopack >/dev/null)
for p in @rspack/core vite next; do
  echo "$p $(node -p "require('$here/node_modules/$p/package.json').version")"
done | tee "$here/results/$label.versions"
{
  node "$here/size.mjs" rspack dist/rspack
  node "$here/size.mjs" vite8 dist/vite
  node "$here/size.mjs" turbopack next/.next/static/chunks
} | tee "$here/results/$label.txt"
