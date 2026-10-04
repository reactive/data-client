#!/usr/bin/env bash
# Decide whether Vercel should build the docs site.
#
# Exit 0 skips the build. Exit 1 builds. Vercel treats every non-zero status
# as "build", so this script exits 0 only when it can see that the published
# site is unchanged. If git history is missing, it builds (fail open).
#
# The published site is website/ (Docusaurus app, blog, pages, static) plus
# the doc trees Docusaurus compiles: docs/core, docs/rest, docs/graphql.
# Package, example, CI, changeset, and other docs changes do not build.
#
# Preview branches must not use `git diff HEAD^ HEAD`. Merging master into a
# pull request makes that diff the incoming master tree, so a site commit
# already on master starts a full preview build of an unrelated PR.

set -u

if [[ "${VERCEL_GIT_COMMIT_REF:-}" == gh-pages* ]]; then
  echo "vercel-ignore: skip — gh-pages branch"
  exit 0
fi

cd "$(git rev-parse --show-toplevel)" || {
  echo "vercel-ignore: build — cannot find repo root"
  exit 1
}

# 0 when this path can change the published site.
is_site_file() {
  local f="$1"
  case "$f" in
    website/*) ;;
    docs/core | docs/core/*) ;;
    docs/rest | docs/rest/*) ;;
    docs/graphql | docs/graphql/*) ;;
    *) return 1 ;;
  esac
  case "$f" in
    website/CHANGELOG.md) return 1 ;;
  esac
  if [[ "$f" == website/* && "$f" == *"/__tests__/"* ]]; then
    return 1
  fi
  if [[ "$f" == website/* ]]; then
    case "$f" in
      *.test.ts | *.test.tsx | *.test.js | *.test.jsx | *.test.mjs | *.test.cjs | *.test.sh)
        return 1
        ;;
    esac
  fi
  return 0
}

# Prints site paths changed between $1 and $2.
# Returns 0 if any, 1 if none, 2 if the diff could not be computed.
site_diff() {
  local base="$1" head="$2" f found=0 tmp
  if ! git cat-file -e "${base}^{commit}" >/dev/null 2>&1; then
    return 2
  fi
  if ! git cat-file -e "${head}^{commit}" >/dev/null 2>&1; then
    return 2
  fi
  tmp="$(mktemp)"
  if ! git diff --name-only --no-renames "$base" "$head" >"$tmp"; then
    rm -f "$tmp"
    return 2
  fi
  while IFS= read -r f; do
    if [ -n "$f" ] && is_site_file "$f"; then
      printf '%s\n' "$f"
      found=1
    fi
  done <"$tmp"
  rm -f "$tmp"
  [ "$found" -eq 1 ]
}

build() {
  echo "vercel-ignore: build — $*"
  exit 1
}

skip() {
  echo "vercel-ignore: skip — $*"
  exit 0
}

decide() {
  local files rc
  files="$(site_diff "$1" "$2")"
  rc=$?
  case "$rc" in
    0) build "$3: ${files//$'\n'/, }" ;;
    1) skip "$3" ;;
    *) build "could not diff $1..$2" ;;
  esac
}

is_ancestor() {
  [ -n "${1:-}" ] && git merge-base --is-ancestor "$1" "$2" >/dev/null 2>&1
}

# Production deploys the branch's own history (squash merges are one commit).
# Previews compare the branch's changes, not commits merged in from upstream.
production_ref() {
  case "${VERCEL_GIT_COMMIT_REF:-}" in
    master | rest-hooks-site) return 0 ;;
  esac
  [ "${VERCEL_ENV:-}" = "production" ]
}

ensure_master() {
  if git rev-parse --verify -q origin/master >/dev/null 2>&1; then
    echo origin/master
    return 0
  fi
  # A local master branch can be stale. Fetch the remote first, and only then
  # fall back to it. Bound the fetch so a hung network call cannot hold a
  # Vercel build machine.
  if command -v timeout >/dev/null 2>&1; then
    timeout 15 git fetch --no-tags --depth=80 origin master:refs/remotes/origin/master >/dev/null 2>&1 || true
  else
    git fetch --no-tags --depth=80 origin master:refs/remotes/origin/master >/dev/null 2>&1 || true
  fi
  if git rev-parse --verify -q origin/master >/dev/null 2>&1; then
    echo origin/master
    return 0
  fi
  if git rev-parse --verify -q master >/dev/null 2>&1; then
    echo master
    return 0
  fi
  return 1
}

prev="${VERCEL_GIT_PREVIOUS_SHA:-}"

if production_ref; then
  if is_ancestor "$prev" HEAD; then
    decide "$prev" HEAD "production changes since ${prev:0:12}"
  elif git rev-parse --verify -q 'HEAD^' >/dev/null 2>&1; then
    decide 'HEAD^' HEAD "production changes in $(git rev-parse --short HEAD)"
  else
    build "production commit has no parent"
  fi
fi

# Merge commit on a preview branch: parents are (branch tip, upstream).
# Diff against the upstream parent so master's files are not "our" changes.
# If this branch already deployed and the branch tip has no new site files
# since then, merging upstream does not need another preview.
if git rev-parse --verify -q 'HEAD^2' >/dev/null 2>&1; then
  if is_ancestor "$prev" 'HEAD^1'; then
    decide "$prev" 'HEAD^1' "preview changes since ${prev:0:12} (merge)"
  else
    decide 'HEAD^2' HEAD "preview changes vs upstream"
  fi
fi

if is_ancestor "$prev" HEAD; then
  decide "$prev" HEAD "preview changes since ${prev:0:12}"
fi

if master="$(ensure_master)"; then
  if base="$(git merge-base HEAD "$master" 2>/dev/null)" && [ -n "$base" ]; then
    decide "$base" HEAD "preview changes vs ${master}"
  fi
fi

if git rev-parse --verify -q 'HEAD^' >/dev/null 2>&1; then
  decide 'HEAD^' HEAD "preview changes in $(git rev-parse --short HEAD)"
fi

build "no base to compare"
