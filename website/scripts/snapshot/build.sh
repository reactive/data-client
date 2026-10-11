#!/usr/bin/env bash
# Builds a frozen copy of the site from an old release, served at
# dataclient.io/<version>/ (see README.md).
#
#   website/scripts/snapshot/build.sh <release checkout> <version> <out.tar.gz>
#
# With SNAPSHOT_ROLE=current it builds the current version's site at the
# root instead, for while master is the next major.
#
# The checkout builds with its own packages, config and tooling, so its
# examples run and type-check as they did when it shipped.
set -euo pipefail

src="$(cd "$1" && pwd)"
version="$2"
out="$(realpath -m "$3")"
here="$(cd "$(dirname "$0")" && pwd)"
yarn="${YARN:-yarn}"
site="$(mktemp -d)"
# the archive's directory, or the root
dir="$([ "${SNAPSHOT_ROLE:-}" = current ] && echo . || echo "$version")"
trap 'rm -rf "$site"' EXIT

cp "$here/docusaurus.snapshot.config.ts" "$here/withoutBlog.ts" "$here/archive.client.ts" "$src/website/"
cd "$src"
$yarn install
# The packages the site imports, with the release's own script when it has one
has() { node -e "process.exit('$1' in require('./package.json').scripts ? 0 : 1)"; }
if has ci:build:website; then
  $yarn ci:build:website
else
  $yarn "$(has ci:build:types && echo ci:build:types || echo build:types)"
  $yarn workspaces foreach -WptivR --from rdc-website --no-private run build:lib
fi
cd website
SNAPSHOT_VERSION="$version" $yarn docusaurus build \
  --config docusaurus.snapshot.config.ts --out-dir "$site/$dir"

# Drop static media nothing in an archive links to (blog videos and images).
# The root keeps everything: other sites link to its files.
cd "$site/$dir"
media="$([ "$dir" = . ] || find img videos -type f 2>/dev/null || true)"
if [ -n "$media" ]; then
  used="$(grep -rohF --include='*.html' --include='*.js' --include='*.css' \
    --include='*.json' --include='*.xml' --include='*.md' --include='*.txt' --include='*.webmanifest' -f <(xargs -d '\n' -n1 basename <<<"$media") . | sort -u || true)"
  while read -r file; do
    grep -qxF -- "$(basename "$file")" <<<"$used" || rm "$file"
  done <<<"$media"
fi
find . -type d -empty -delete

tar -czf "$out" -C "$site" "$dir"
echo "Built $out ($(du -h "$out" | cut -f1))"
