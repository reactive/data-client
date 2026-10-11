#!/usr/bin/env bash
# Unpacks the archived versions listed in website/versionsArchived.json into
# the built site, so each serves at /<version>/. Their builds live on the
# `docs-v<version>` GitHub releases (made by docs-snapshot.yml).
#
#   website/scripts/snapshot/fetch.sh <site build dir>
set -euo pipefail

build="$1"
repo="${GITHUB_REPOSITORY:-reactive/data-client}"
here="$(cd "$(dirname "$0")" && pwd)"
for version in $(node -p "require('$here/../../versionsArchived.json').join(' ')"); do
  curl -fsSL --retry 3 \
    "https://github.com/$repo/releases/download/docs-v$version/docs-$version.tar.gz" |
    tar -xz -C "$build"
done
