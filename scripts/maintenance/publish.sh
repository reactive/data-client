#!/usr/bin/env bash
# release.yml's publish command on a maintenance branch (cut.sh sets it).
# Until the next major ships, this branch's versions are npm's `latest`;
# after, they publish under v<version> so `latest` stays on the newest.
set -euo pipefail

ours="$(node -p "require('./packages/react/package.json').version")"
latest="$(npm view @data-client/react@latest version)"
line() { [[ "$1" == 0.* ]] && echo "${1%.*}" || echo "${1%%.*}"; }
tag=latest
[ "$(printf '%s\n%s\n' "$ours" "$latest" | sort -V | tail -1)" = "$ours" ] ||
  tag="v$(line "$ours")"
echo "Publishing $ours as $tag (latest is $latest)"
# yarn appends the tag to the script's last command, npm publish
yarn changeset:publish --tag "$tag"
