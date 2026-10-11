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
node -p "require('$here/../../versionsArchived.json').map(v => v.version + ' ' + v.sha256).join('\\n')" |
  while read -r version sha256; do
    [ -n "$version" ] || continue
    file="$(mktemp)"
    curl -fsSL --retry 3 -o "$file" \
      "https://github.com/$repo/releases/download/docs-v$version/docs-$version.tar.gz"
    # docs-snapshot.yml recorded the checksum of the archive it built
    echo "$sha256  $file" | sha256sum -c --quiet
    tar -xzf "$file" -C "$build"
    rm "$file"
  done
