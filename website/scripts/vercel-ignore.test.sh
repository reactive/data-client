#!/usr/bin/env bash
# Exercises website/scripts/vercel-ignore.sh against a throwaway repo.
set -euo pipefail

root="$(cd "$(dirname "$0")/../.." && pwd)"
script="$root/website/scripts/vercel-ignore.sh"
repo="$(mktemp -d)"
trap 'rm -rf "$repo"' EXIT

git -C "$repo" init -b master >/dev/null
git -C "$repo" config user.email "vercel-ignore-test@example.com"
git -C "$repo" config user.name "vercel-ignore-test"
git -C "$repo" config commit.gpgsign false
git -C "$repo" config core.fsmonitor false
git -C "$repo" config core.untrackedcache false

commit() {
  local msg="$1"
  shift
  local path
  for path in "$@"; do
    mkdir -p "$repo/$(dirname "$path")"
    printf '%s\n' "$msg" >>"$repo/$path"
    git -C "$repo" add -- "$path"
  done
  git -C "$repo" commit -m "$msg" >/dev/null
}

run_ignore() {
  local ref="$1"
  local prev="${2-}"
  (
    cd "$repo"
    VERCEL_GIT_COMMIT_REF="$ref" \
      VERCEL_GIT_PREVIOUS_SHA="$prev" \
      VERCEL_ENV="${3:-}" \
      bash "$script"
  )
}

expect_skip() {
  local name="$1"
  shift
  local out rc
  set +e
  out="$(run_ignore "$@" 2>&1)"
  rc=$?
  set -e
  if [ "$rc" -ne 0 ]; then
    printf 'FAIL %s: expected skip (0), got %s\n%s\n' "$name" "$rc" "$out" >&2
    exit 1
  fi
  printf 'ok   %s\n' "$name"
}

expect_build() {
  local name="$1"
  shift
  local out rc
  set +e
  out="$(run_ignore "$@" 2>&1)"
  rc=$?
  set -e
  if [ "$rc" -ne 1 ]; then
    printf 'FAIL %s: expected build (1), got %s\n%s\n' "$name" "$rc" "$out" >&2
    exit 1
  fi
  printf 'ok   %s\n' "$name"
}

commit "init" README.md

# --- production (master): one squash commit ---
commit "pkg" packages/core/src/index.ts
expect_skip "master package-only" master

commit "docs page" docs/core/api/Controller.md
expect_build "master docs/core" master

commit "roadmap" docs/ROADMAP.md
expect_skip "master docs/ROADMAP.md" master

commit "prettier" docs/.prettierrc
expect_skip "master docs/.prettierrc" master

commit "blog" website/blog/2026-10-04-note.md
expect_build "master website blog" master

commit "changelog" website/CHANGELOG.md
expect_skip "master website changelog" master

commit "unit test" website/src/components/Playground/__tests__/transformCode.test.ts
expect_skip "master website unit test" master

commit "colocated test" website/src/components/Playground/transformCode.test.ts website/scripts/vercel-ignore.test.sh
expect_skip "master colocated website tests" master

commit "ci" .circleci/config.yml .github/workflows/benchmark.yml
expect_skip "master CI-only" master

# Last successful production deploy was before a package commit. Still skip.
pkg_sha="$(git -C "$repo" rev-parse HEAD)"
commit "another pkg" packages/rest/src/index.ts
expect_skip "master package since previous deploy" master "$pkg_sha"

# --- preview branch, linear ---
git -C "$repo" checkout -b feature >/dev/null 2>&1
commit "feature pkg" packages/vue/src/index.ts .changeset/preview.md
expect_skip "preview package and changeset" feature

commit "feature roadmap" docs/ROADMAP.md
expect_skip "preview docs that are not published" feature

commit "feature page" docs/rest/api/Entity.md
expect_build "preview docs/rest" feature

commit "feature ci follow-up" .github/workflows/site-preview.yml
# Whole branch still contains docs/rest, and there is no previous deploy,
# so the site change must still build.
expect_build "preview follow-up after unpublished site change" feature

page_sha="$(git -C "$repo" rev-parse HEAD)"
commit "feature pkg follow-up" packages/core/src/other.ts
expect_skip "preview package follow-up after site deploy" feature "$page_sha"

commit "playground source" website/src/components/Playground/transformCode.ts
expect_build "preview playground source since last deploy" feature "$page_sha"

# Multi-commit branch with no prior deploy: the site edit is not the tip.
git -C "$repo" checkout master >/dev/null 2>&1
git -C "$repo" checkout -b stacked >/dev/null 2>&1
commit "stacked site" website/src/pages/index.js
commit "stacked pkg" packages/endpoint/src/index.ts
expect_build "preview multi-commit site change not at tip" stacked

# --- merge master into a package PR (the credit-burn case) ---
git -C "$repo" checkout master >/dev/null 2>&1
commit "master site moves" website/src/pages/index.js docs/core/concepts/overview.md
master_sha="$(git -C "$repo" rev-parse HEAD)"

git -C "$repo" checkout -b pkg-pr >/dev/null 2>&1
# Branch point is the commit BEFORE "master site moves" only if we reset.
# Recreate the PR from the parent of that master commit so master is ahead.
git -C "$repo" reset --hard HEAD^ >/dev/null
commit "pr packages" packages/core/src/set.ts .circleci/config.yml
git -C "$repo" merge --no-edit "$master_sha" >/dev/null
expect_skip "preview merge of master into package PR" pkg-pr

# Site PR already deployed, then merges a master that also changed the site.
git -C "$repo" checkout master >/dev/null 2>&1
git -C "$repo" checkout -b site-pr >/dev/null 2>&1
git -C "$repo" reset --hard HEAD^ >/dev/null
commit "pr website" website/docusaurus.config.ts
deployed="$(git -C "$repo" rev-parse HEAD)"
git -C "$repo" merge --no-edit "$master_sha" >/dev/null
expect_skip "preview merge after the site commit already deployed" site-pr "$deployed"

# Site PR that has never deployed, merged with master: still build.
git -C "$repo" checkout -B site-pr-fresh "$deployed" >/dev/null 2>&1
git -C "$repo" merge --no-edit "$master_sha" >/dev/null
expect_build "preview merge of a site PR with no prior deploy" site-pr-fresh

# gh-pages branches never build, even if website files differ.
expect_skip "gh-pages branch" gh-pages-bench

# VERCEL_ENV=production uses this branch's history, not the diff against master.
# A site commit still builds; a later package-only commit does not.
git -C "$repo" checkout master >/dev/null 2>&1
expect_build "production env site tip" other-branch "" production
commit "prod pkg" packages/normalizr/src/index.ts
expect_skip "production env package tip" other-branch "" production

echo "all vercel-ignore cases passed"
