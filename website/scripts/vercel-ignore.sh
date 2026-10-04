#!/usr/bin/env bash
# Decide whether Vercel should build the docs site.
#
# Exit 0 skips the build. Exit 1 builds. Vercel treats every non-zero status
# as "build", so this script exits 0 only when it can see that the published
# site is unchanged. If git history is missing, it builds (fail open).
#
# Preview branches must not use `git diff HEAD^ HEAD`. Merging master into a
# pull request makes that diff the incoming master tree, so a site commit
# already on master starts a full preview build of an unrelated PR.

set -u

# The published site: the Docusaurus app plus the doc trees it compiles.
# Keep in sync with the `paths` of site-preview.yml and site-release.yml.
SITE_PATHS=(
  website docs/core docs/rest docs/graphql
  ':(exclude)website/CHANGELOG.md'
  ':(exclude,glob)website/**/__tests__/**'
  ':(exclude,glob)website/**/*.test.*'
)

build() {
  echo "vercel-ignore: build — $*"
  exit 1
}

skip() {
  echo "vercel-ignore: skip — $*"
  exit 0
}

[[ "${VERCEL_GIT_COMMIT_REF:-}" == gh-pages* ]] && skip "gh-pages branch"

cd "$(git rev-parse --show-toplevel)" || build "cannot find repo root"

# Builds if site paths changed between $1 and $2 (or the diff fails); else skips.
decide() {
  local files
  files="$(git diff --name-only --no-renames "$1" "$2" -- "${SITE_PATHS[@]}" 2>/dev/null)" ||
    build "could not diff $1..$2"
  [ -n "$files" ] || skip "$3"
  build "$3: ${files//$'\n'/, }"
}

has_rev() {
  git rev-parse --verify -q "$1" >/dev/null
}

is_ancestor() {
  [ -n "$1" ] && git merge-base --is-ancestor "$1" "$2" 2>/dev/null
}

# Prints master's sha. Vercel clones shallow, so fetch it if missing; the
# timeout keeps a hung network call from holding the build machine.
upstream() {
  has_rev origin/master ||
    timeout 15 git fetch -q --no-tags --depth=80 origin master:refs/remotes/origin/master 2>/dev/null
  git rev-parse --verify -q origin/master || git rev-parse --verify -q master
}

prev="${VERCEL_GIT_PREVIOUS_SHA:-}"

# Production deploys the branch's own history (squash merges are one commit).
if [[ "${VERCEL_GIT_COMMIT_REF:-}" =~ ^(master|rest-hooks-site)$ || "${VERCEL_ENV:-}" == production ]]; then
  is_ancestor "$prev" HEAD && decide "$prev" HEAD "production changes since ${prev:0:12}"
  has_rev 'HEAD^' && decide 'HEAD^' HEAD "production changes in $(git rev-parse --short HEAD)"
  build "production commit has no parent"
fi

# Previews compare the branch's changes, not commits merged in from upstream.
# A merge commit's parents are (branch tip, upstream): if the branch tip has
# no new site files since the last preview, merging upstream needs no rebuild;
# otherwise diff against the upstream parent so master's files don't count.
if has_rev 'HEAD^2'; then
  is_ancestor "$prev" 'HEAD^1' && decide "$prev" 'HEAD^1' "preview changes since ${prev:0:12} (merge)"
  decide 'HEAD^2' HEAD "preview changes vs upstream"
fi

is_ancestor "$prev" HEAD && decide "$prev" HEAD "preview changes since ${prev:0:12}"

if master="$(upstream)" && base="$(git merge-base HEAD "$master" 2>/dev/null)"; then
  decide "$base" HEAD "preview changes vs master"
fi

has_rev 'HEAD^' && decide 'HEAD^' HEAD "preview changes in $(git rev-parse --short HEAD)"

build "no base to compare"
