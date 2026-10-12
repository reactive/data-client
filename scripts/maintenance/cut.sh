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
source "$here/version-line.sh"
is_line "$version" || { echo "$version isn't a release line, like 0.18 or 1" >&2; exit 1; }
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
# One release queue across branches, so this branch and master can't both
# claim GitHub's Latest release at once (a ref older than that queued per ref)
sed -i 's/^  group: ${{ github.workflow }}-${{ github.ref }}$/  group: ${{ github.workflow }}/' \
  .github/workflows/release.yml
grep -qF 'scripts/maintenance/publish.sh' .github/workflows/release.yml ||
  { echo "Couldn't point release.yml at publish.sh; edit it by hand" >&2; exit 1; }
grep -q 'edit/master' website/docusaurus.config.ts ||
  { echo "Couldn't find docusaurus.config.ts's edit links; edit it by hand" >&2; exit 1; }
# Its pages' edit links, and the release tags it creates, point at the branch
sed -i "s#/edit/master#/edit/$branch#g" website/docusaurus.config.ts
cp "$here/../create-github-releases.mjs" scripts/
mkdir -p scripts/maintenance
cp "$here/publish.sh" "$here/version-line.sh" scripts/maintenance/
# A release tag predates its archive listing PR: the previous version is
# archived, not current (siteVersions.ts rejects a version that's both)
rm -f website/versionCurrent.json
# master's pending changesets are the next major's and release from master, so
# the branch versions only its own fixes (README.md: re-add any a later ref needs)
echo "Dropping master's changesets:"
find .changeset -maxdepth 1 -name '*.md' ! -name README.md -print -delete
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
