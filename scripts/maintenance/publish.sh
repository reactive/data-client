#!/usr/bin/env bash
# release.yml's publish command on a maintenance branch (cut.sh sets it).
# Until the next major ships, this branch's versions are npm's `latest`;
# after, they publish under latest-<version> so `latest` stays on the newest
# (npm rejects tags that parse as versions, like v0.18).
set -euo pipefail

ours="$(node -p "require('./packages/react/package.json').version")"
latest="$(npm view @data-client/react@latest version)"
source "$(dirname "$0")/version-line.sh"
tag=latest
[ "$(printf '%s\n%s\n' "$ours" "$latest" | sort -V | tail -1)" = "$ours" ] ||
  tag="latest-$(line "$ours")"
echo "Publishing $ours as $tag (latest is $latest)"
# changeset:publish with a tag, spelled out so the tag can't land on another command
yarn build
yarn workspaces foreach -A --no-private --topological \
  npm publish --tolerate-republish --access public --tag "$tag"
