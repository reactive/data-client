#!/usr/bin/env bash
# Builds a frozen copy of the site from an old release, served at
# dataclient.io/<version>/ (see README.md).
#
#   website/scripts/snapshot/build.sh <release checkout> <version> <out.tar.gz>
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
trap 'rm -rf "$site"' EXIT

cp "$here/docusaurus.snapshot.config.ts" "$src/website/"
cd "$src"
YARN_ENABLE_IMMUTABLE_INSTALLS=false $yarn install
# Package types, then the libraries the site imports
$yarn build:types
$yarn workspaces foreach -WptivR --from rdc-website --no-private run build:lib
cd website
SNAPSHOT_VERSION="$version" $yarn docusaurus build \
  --config docusaurus.snapshot.config.ts --out-dir "$site/$version"

# Drop static media nothing in the archive links to (blog videos and images)
cd "$site/$version"
find img videos -type f 2>/dev/null | while read -r file; do
  grep -rqlF --include='*.html' --include='*.js' --include='*.css' \
    --include='*.json' --include='*.xml' "$(basename "$file")" . || rm "$file"
done
find . -type d -empty -delete

tar -czf "$out" -C "$site" "$version"
echo "Built $out ($(du -h "$out" | cut -f1))"
