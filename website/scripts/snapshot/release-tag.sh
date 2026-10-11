#!/usr/bin/env bash
# Prints <version>'s newest @data-client/react release tag (0.18 ->
# @data-client/react@0.18.1), or fails if it has none.
#
#   website/scripts/snapshot/release-tag.sh <version>
set -euo pipefail

version="$1"
tag="$(git ls-remote --tags --refs origin "refs/tags/@data-client/react@$version.*" |
  sed 's#.*refs/tags/##' | grep -E "@${version//./\\.}(\.[0-9]+)+$" | sort -V | tail -1 || true)"
[ -n "$tag" ] || { echo "No @data-client/react@$version.* tag" >&2; exit 1; }
echo "$tag"
