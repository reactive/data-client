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
#
# Renovate previews (renovate/*) skip when every published-site change is a
# non-major dependency bump under website/. A major bump of a package declared
# in a website package.json still builds, unless yarn prepare is expected to
# fail before the site compiles (below). Real site or docs changes still
# build, including on a Renovate branch. Production (master, rest-hooks-site,
# or VERCEL_ENV=production) is never skipped by these preview rules.
#
# The docs-site install command is `cd .. && yarn install && yarn prepare &&
# yarn ci:build && cd website && ...`. yarn install succeeds; yarn prepare
# runs `tsc --build` and exits 2 when react-native >= 0.87 is installed,
# because that release dropped InteractionManager and packages/react still
# imports it (TS2305). Previews with no site or docs source change skip in
# that case instead of starting a build that dies in the install command.
# A real site or docs change still builds, so a site-source failure is not
# hidden.

set -u

DECIDE_JS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/vercel-ignore-decide.js"

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

preview_context() {
  [[ "${VERCEL_ENV:-}" == production ]] && return 1
  [[ "${VERCEL_GIT_COMMIT_REF:-}" =~ ^(master|rest-hooks-site)$ ]] && return 1
  return 0
}

is_website_manifest() {
  [[ "$1" =~ ^website/(.+/)?package\.json$ ]] && return 0
  [[ "$1" =~ ^website/(.+/)?(yarn\.lock|package-lock\.json|pnpm-lock\.yaml|npm-shrinkwrap\.json)$ ]]
}

# True when a changed path is published site or docs source, not a website
# dependency manifest.
site_source_changed() {
  local f
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    is_website_manifest "$f" || return 0
  done <<<"$1"
  return 1
}

# True when every changed path is a website lockfile or a package.json whose
# only edits are non-major dependency bumps.
renovate_nonmajor_only() {
  local base="$1" head="$2" f old new
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    if [[ "$f" =~ ^website/(.+/)?(yarn\.lock|package-lock\.json|pnpm-lock\.yaml|npm-shrinkwrap\.json)$ ]]; then
      continue
    fi
    if [[ "$f" =~ ^website/(.+/)?package\.json$ ]]; then
      old="$(git show "$base:$f" 2>/dev/null)" || return 1
      new="$(git show "$head:$f" 2>/dev/null)" || return 1
      OLD_PKG="$old" NEW_PKG="$new" node "$DECIDE_JS" classify >/dev/null || return 1
      continue
    fi
    return 1
  done <<<"$3"
  return 0
}

# True when yarn prepare would exit 2 for the known InteractionManager break.
# A missing node, or any other uncertainty, returns false so the build runs.
expected_prepare_failure() {
  command -v node >/dev/null 2>&1 || return 1
  node "$DECIDE_JS" prepare-failure
}

# Skip a preview that cannot show a site change: Renovate non-major website
# dependency bumps, or an install that dies in yarn prepare before the site
# compiles. Returns without skipping when the preview should build.
maybe_skip_preview() {
  preview_context || return 0
  site_source_changed "$3" && return 0
  if [[ "${VERCEL_GIT_COMMIT_REF:-}" == renovate/* ]] && renovate_nonmajor_only "$1" "$2" "$3"; then
    skip "$4: renovate non-major website dependency bumps"
  fi
  if expected_prepare_failure; then
    skip "$4: yarn prepare would exit 2 (react-native dropped InteractionManager)"
  fi
}

# Builds if site paths changed between $1 and $2 (or the diff fails); else skips.
decide() {
  local files
  files="$(git diff --name-only --no-renames "$1" "$2" -- "${SITE_PATHS[@]}" 2>/dev/null)" ||
    build "could not diff $1..$2"
  [ -n "$files" ] || skip "$3"
  maybe_skip_preview "$1" "$2" "$files" "$3"
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

# Previews compare the branch's changes, not commits merged in from upstream.
# When the tip merges master, diff against the merged master commit: that
# counts the branch's site files and any conflict resolutions, not master's.
# Merges of other branches fall through and count in full.
if has_rev 'HEAD^2' && master="$(upstream)" && is_ancestor 'HEAD^2' "$master"; then
  decide 'HEAD^2' HEAD "preview changes vs master (merge)"
fi

is_ancestor "$prev" HEAD && decide "$prev" HEAD "preview changes since ${prev:0:12}"

if base="$(merge_base)" || { deepen && base="$(merge_base)"; }; then
  decide "$base" HEAD "preview changes vs master"
fi

# Without a base, the tip commit alone can't prove earlier commits left the
# site unchanged.
build "no base to compare"
