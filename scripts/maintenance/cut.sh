#!/usr/bin/env bash
# Cuts a maintenance branch for <version> when master takes the next major's
# first breaking change (README.md). Run from a checkout of this repo, with
# push access (the branch adds a workflow, which the Actions token can't):
#
#   scripts/maintenance/cut.sh <version> [ref]
#
# It cuts <version>.x from ref (default: <version>'s newest
# @data-client/react tag; pass the last master commit before the breaking
# change to keep what merged since), which then releases <version> and
# serves its docs at the root. It also pushes next-<version>, adding
# website/versionCurrent.json to master, to open as a PR: once that merges,
# master's docs serve at /next/.
set -euo pipefail

version="$1"
here="$(cd "$(dirname "$0")" && pwd)"
git fetch --tags origin master
ref="${2:-$("$here/../../website/scripts/snapshot/release-tag.sh" "$version")}"
branch="$version.x"
tree="$(mktemp -d)"
trap 'git worktree remove --force "$tree" 2>/dev/null || true' EXIT

git worktree add -b "$branch" "$tree" "$ref"
cd "$tree"
# Releases from the branch, without taking npm's `latest` once the next major
# has it, and builds a site preview for its PRs. The first `- master` in each
# is its pull_request (site-preview.yml) or push (release.yml) branch.
sed -i "s/\"baseBranch\": \"master\"/\"baseBranch\": \"$branch\"/" .changeset/config.json
sed -i 's#publish: yarn changeset:publish$#publish: bash scripts/maintenance/publish.sh#' \
  .github/workflows/release.yml
for workflow in release site-preview; do
  sed -i "0,/^      - master$/s//      - $branch/" ".github/workflows/$workflow.yml"
  grep -qF -- "- $branch" ".github/workflows/$workflow.yml" ||
    { echo "Couldn't point $workflow.yml at $branch; edit it by hand" >&2; exit 1; }
done
grep -qF 'scripts/maintenance/publish.sh' .github/workflows/release.yml ||
  { echo "Couldn't point release.yml at publish.sh; edit it by hand" >&2; exit 1; }
mkdir -p scripts/maintenance
cp "$here/publish.sh" scripts/maintenance/
# Deploys the root docs and ports each push to master
cp "$here/maintenance.yml" .github/workflows/
git add -A
git commit -m "internal: Release and deploy $version from $branch"
git push -u origin "$branch"

git switch --detach origin/master
printf '{\n  "version": "%s",\n  "ref": "%s"\n}\n' "$version" "$branch" \
  > website/versionCurrent.json
git switch -c "next-$version"
git add website/versionCurrent.json
git commit -m "docs: Serve master's docs at /next while $branch serves the root"
git push -u origin "next-$version"
echo "Open a PR from next-$version. Once it merges, $branch serves the root and master /next."
