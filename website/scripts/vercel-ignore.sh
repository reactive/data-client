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
# when a comparison base is out of reach.
deepen() {
  [ -n "${VERCEL_GIT_COMMIT_REF:-}" ] &&
    timeout 30 git fetch -q --no-tags --deepen=300 origin "$VERCEL_GIT_COMMIT_REF" \
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
# ref is replaced; refetching later with --depth would undo deepen(). The
# timeout keeps a hung network call from holding the build machine.
timeout 15 git fetch -q --no-tags --depth=80 origin +master:refs/remotes/origin/master 2>/dev/null

# Renovate previews skip when only website dependency manifests or lockfiles
# changed. Site or docs source changes still build.
if [[ "${VERCEL_GIT_COMMIT_REF:-}" == renovate/* ]]; then
  for f in package.json yarn.lock package-lock.json pnpm-lock.yaml npm-shrinkwrap.json; do
    SITE_PATHS+=(":(exclude,glob)website/**/$f")
  done
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
