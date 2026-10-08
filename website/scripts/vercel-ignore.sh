#!/usr/bin/env bash
# Decide whether site-preview.yml deploys the docs site to Vercel.
#
# Exit 0 skips the deploy. Exit 1 deploys, as does every other non-zero
# status, so this script exits 0 only when it can see that the published
# site is unchanged. If git history is missing, it deploys (fail open).
# `--superseded` is the exception: it exits 2 when it can't fetch master.
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

build() {
  echo "vercel-ignore: build — $*"
  exit 1
}

skip() {
  echo "vercel-ignore: skip — $*"
  exit 0
}

cd "$(git rev-parse --show-toplevel)" || build "cannot find repo root"

site_files() {
  git diff --name-only --no-renames "$1" "$2" -- "${SITE_PATHS[@]}" 2>/dev/null
}

# Builds if site paths changed between $1 and $2 (or the diff fails); else skips.
decide() {
  local files
  files="$(site_files "$1" "$2")" || build "could not diff $1..$2"
  [ -n "$files" ] || skip "$3"
  build "$3: ${files//$'\n'/, }"
}

has_rev() {
  git rev-parse --verify -q "$1" >/dev/null
}

is_ancestor() {
  [ -n "$1" ] && git merge-base --is-ancestor "$1" "$2" 2>/dev/null
}

# Prints master's sha. A ref equal to HEAD is never master's tip: a checkout
# of master carries a local `master` at the commit being built, and comparing
# HEAD with itself empties every diff.
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

merge_base() {
  master="$(upstream)" && git merge-base HEAD "$master" 2>/dev/null
}

# Never a --depth or --deepen fetch: on site-preview.yml's full clone it makes
# the repo shallow and cuts the history Docusaurus dates pages with. The
# timeout keeps a hung network call from holding the job.
fetch_master() {
  timeout 60 git fetch -q --no-tags origin +master:refs/remotes/origin/master 2>/dev/null
}

# `--superseded` (docs deploy, just before a production deploy): skip when
# master has moved on to a commit that changed the site. That commit's queued
# run deploys it, so deploying HEAD would roll production back. Exits 2 when
# master can't be fetched: a re-run could be stale, so don't guess.
if [ "${1:-}" = --superseded ]; then
  fetch_master || { echo "vercel-ignore: cannot fetch master"; exit 2; }
  tip="$(upstream)" && is_ancestor HEAD "$tip" || build "master has no newer commit"
  files="$(site_files HEAD "$tip")" || build "could not diff HEAD..$tip"
  [ -n "$files" ] && skip "master moved on to ${tip:0:12}, which changed the site"
  build "newer master commits leave the site unchanged"
fi

prev="${VERCEL_GIT_PREVIOUS_SHA:-}"

# A push can carry several commits (rebase merges), so compare against the
# last deploy.
if [[ "${VERCEL_GIT_COMMIT_REF:-}" == master || "${VERCEL_ENV:-}" == production ]]; then
  is_ancestor "$prev" HEAD && decide "$prev" HEAD "production changes since ${prev:0:12}"
  build "no previous production deploy to compare"
fi

# Previews need the real master, forced so a stale ref is replaced.
fetch_master

# Previews compare the branch's changes, not commits merged in from upstream.
# When the tip merges master, diff against the merged master commit: that
# counts the branch's site files and any conflict resolutions, not master's.
# Merges of other branches fall through and count in full.
if has_rev 'HEAD^2' && master="$(upstream)" && is_ancestor 'HEAD^2' "$master"; then
  decide 'HEAD^2' HEAD "preview changes vs master (merge)"
fi

is_ancestor "$prev" HEAD && decide "$prev" HEAD "preview changes since ${prev:0:12}"

if base="$(merge_base)"; then
  decide "$base" HEAD "preview changes vs master (base ${base:0:12})"
fi

# Without a base, the tip commit alone can't prove earlier commits left the
# site unchanged.
build "no base to compare"
