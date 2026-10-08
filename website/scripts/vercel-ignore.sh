#!/usr/bin/env bash
# Decide whether site-preview.yml deploys the docs site to Vercel.
#
# Exit 0 skips the deploy. Exit 1 deploys, as does every other non-zero
# status, so this script exits 0 only when it can see that the published
# site is unchanged. If git history is missing, it deploys (fail open).
#
# Preview branches must not use `git diff HEAD^ HEAD`. Merging master into a
# pull request makes that diff the incoming master tree, so a site commit
# already on master starts a full preview build of an unrelated PR.

set -u

# The published site: the Docusaurus app plus the doc trees it compiles.
# Keep in sync with the `paths` of site-preview.yml.
SITE_PATHS=(
  website docs/core docs/rest docs/graphql
  ':(exclude)website/CHANGELOG.md'
  ':(exclude,glob)website/**/__tests__/**'
  ':(exclude,glob)website/**/*.test.*'
)

# site-preview.yml diffs newer master commits with these
if [ "${1:-}" = --paths ]; then
  printf '%s\0' "${SITE_PATHS[@]}"
  exit 0
fi

build() {
  echo "vercel-ignore: build — $*"
  exit 1
}

skip() {
  echo "vercel-ignore: skip — $*"
  exit 0
}

[[ "${VERCEL_GIT_COMMIT_REF:-}" == gh-pages* ]] && skip "gh-pages branch"
# The merge queue tests a PR already previewed on its own branch
[[ "${VERCEL_GIT_COMMIT_REF:-}" == gh-readonly-queue/* ]] && skip "merge queue branch"

cd "$(git rev-parse --show-toplevel)" || build "cannot find repo root"

# Vercel's clone has no `origin` remote, so every fetch below would fail. Add
# one for the (public) repo; the clone is thrown away after the build.
git remote get-url origin >/dev/null 2>&1 ||
  { [ -n "${VERCEL_GIT_REPO_OWNER:-}" ] && [ -n "${VERCEL_GIT_REPO_SLUG:-}" ] &&
    git remote add origin "https://github.com/$VERCEL_GIT_REPO_OWNER/$VERCEL_GIT_REPO_SLUG.git"; }

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

# A full clone already has every commit; a --depth or --deepen fetch would
# make it shallow and cut the history Docusaurus dates pages with.
shallow() {
  [ "$(git rev-parse --is-shallow-repository 2>/dev/null)" = true ]
}

# Prints master's sha. A ref equal to HEAD is never trusted as master: Vercel's
# clone can carry one at the commit being built, which empties every diff.
upstream() {
  local head ref sha
  head="$(git rev-parse HEAD)"
  for ref in origin/master master; do
    sha="$(git rev-parse --verify -q "$ref^{commit}")" && [ "$sha" != "$head" ] && {
      echo "$sha"
      return 0
    }
  done
  return 1
}

# Vercel clones about 10 commits deep. Fetch more of this branch and master
# when a comparison base is out of reach. One fetch per ref: when both go in
# one call, newer git (2.55) can leave master at its old depth.
deepen() {
  shallow || return 1
  [ -n "${VERCEL_GIT_COMMIT_REF:-}" ] || return 1
  timeout 30 git fetch -q --no-tags --deepen=300 origin "$VERCEL_GIT_COMMIT_REF" 2>/dev/null
  timeout 30 git fetch -q --no-tags --deepen=300 origin \
    '+refs/heads/master:refs/remotes/origin/master' 2>/dev/null
}

merge_base() {
  master="$(upstream)" && git merge-base HEAD "$master" 2>/dev/null
}

prev="${VERCEL_GIT_PREVIOUS_SHA:-}"

# A push can carry several commits (rebase merges), so compare against the
# last deploy.
if [[ "${VERCEL_GIT_COMMIT_REF:-}" =~ ^(master|rest-hooks-site)$ || "${VERCEL_ENV:-}" == production ]]; then
  [ -n "$prev" ] && ! has_rev "$prev^{commit}" && deepen
  is_ancestor "$prev" HEAD && decide "$prev" HEAD "production changes since ${prev:0:12}"
  build "no previous production deploy to compare"
fi

# Previews need the real master. Fetch it once, forced, so a clone-provided
# ref is replaced. A --depth fetch would make a full clone shallow, which cuts
# the history Docusaurus dates pages with, so only an already-shallow clone
# (Vercel's) uses one. The timeout keeps a hung network call from holding the job.
if shallow; then
  timeout 15 git fetch -q --no-tags --depth=80 origin +master:refs/remotes/origin/master 2>/dev/null
else
  timeout 60 git fetch -q --no-tags origin +master:refs/remotes/origin/master 2>/dev/null
fi

# Previews compare the branch's changes, not commits merged in from upstream.
# When the tip merges master, diff against the merged master commit: that
# counts the branch's site files and any conflict resolutions, not master's.
# Merges of other branches fall through and count in full.
if has_rev 'HEAD^2' && master="$(upstream)" && is_ancestor 'HEAD^2' "$master"; then
  decide 'HEAD^2' HEAD "preview changes vs master (merge)"
fi

is_ancestor "$prev" HEAD && decide "$prev" HEAD "preview changes since ${prev:0:12}"

if base="$(merge_base)" || { deepen && base="$(merge_base)"; }; then
  decide "$base" HEAD "preview changes vs master (base ${base:0:12})"
fi

# Without a base, the tip commit alone can't prove earlier commits left the
# site unchanged.
build "no base to compare"
