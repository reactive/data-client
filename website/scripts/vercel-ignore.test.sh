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

# expect <skip|build> <name> <ref> [previous-sha] [vercel-env]
expect() {
  local want="$1" name="$2" ref="$3" out rc code=1
  [ "$want" = skip ] && code=0
  set +e
  out="$(
    cd "$repo" &&
      VERCEL_GIT_COMMIT_REF="$ref" VERCEL_GIT_PREVIOUS_SHA="${4-}" VERCEL_ENV="${5-}" \
        bash "$script" 2>&1
  )"
  rc=$?
  set -e
  if [ "$rc" -ne "$code" ]; then
    printf 'FAIL %s: expected %s (%s), got %s\n%s\n' "$name" "$want" "$code" "$rc" "$out" >&2
    exit 1
  fi
  printf 'ok   %s\n' "$name"
}

# Previous deploy for a single-commit push.
parent() { git -C "$repo" rev-parse HEAD^; }

commit "init" README.md

# --- production (master): one squash commit ---
commit "pkg" packages/core/src/index.ts
expect skip "master package-only" master "$(parent)"

commit "docs page" docs/core/api/Controller.md
expect build "master docs/core" master "$(parent)"

commit "roadmap" docs/ROADMAP.md
expect skip "master docs/ROADMAP.md" master "$(parent)"

commit "prettier" docs/.prettierrc
expect skip "master docs/.prettierrc" master "$(parent)"

commit "blog" website/blog/2026-10-04-note.md
expect build "master website blog" master "$(parent)"

commit "changelog" website/CHANGELOG.md
expect skip "master website changelog" master "$(parent)"

commit "unit test" website/src/components/Playground/__tests__/transformCode.test.ts website/src/components/Playground/__tests__/fixture.json
expect skip "master website unit test" master "$(parent)"

commit "colocated test" website/src/components/Playground/transformCode.test.ts website/scripts/vercel-ignore.test.sh
expect skip "master colocated website tests" master "$(parent)"

commit "ci" .circleci/config.yml .github/workflows/benchmark.yml
expect skip "master CI-only" master "$(parent)"

# Last successful production deploy was before a package commit. Still skip.
pkg_sha="$(git -C "$repo" rev-parse HEAD)"
commit "another pkg" packages/rest/src/index.ts
expect skip "master package since previous deploy" master "$pkg_sha"

# --- preview branch, linear ---
git -C "$repo" checkout -b feature >/dev/null 2>&1
commit "feature pkg" packages/vue/src/index.ts .changeset/preview.md
expect skip "preview package and changeset" feature

commit "feature roadmap" docs/ROADMAP.md
expect skip "preview docs that are not published" feature

commit "feature page" docs/rest/api/Entity.md
expect build "preview docs/rest" feature

commit "graphql page" docs/graphql/api/GQLEndpoint.md
expect build "preview docs/graphql since last deploy" feature "$(git -C "$repo" rev-parse HEAD^)"

commit "feature ci follow-up" .github/workflows/site-preview.yml
# Whole branch still contains docs/rest, and there is no previous deploy,
# so the site change must still build.
expect build "preview follow-up after unpublished site change" feature

page_sha="$(git -C "$repo" rev-parse HEAD)"
commit "feature pkg follow-up" packages/core/src/other.ts
expect skip "preview package follow-up after site deploy" feature "$page_sha"

commit "playground source" website/src/components/Playground/transformCode.ts
expect build "preview playground source since last deploy" feature "$page_sha"

# Multi-commit branch with no prior deploy: the site edit is not the tip.
git -C "$repo" checkout -b stacked master >/dev/null 2>&1
commit "stacked site" website/src/pages/index.js
commit "stacked pkg" packages/endpoint/src/index.ts
expect build "preview multi-commit site change not at tip" stacked

# --- merge master into a package PR (the credit-burn case) ---
git -C "$repo" checkout master >/dev/null 2>&1
commit "master site moves" website/src/pages/index.js docs/core/concepts/overview.md
master_sha="$(git -C "$repo" rev-parse HEAD)"

# Branch from before that commit, so master is ahead when the PR merges it.
git -C "$repo" checkout -b pkg-pr "$master_sha^" >/dev/null 2>&1
commit "pr packages" packages/core/src/set.ts .circleci/config.yml
git -C "$repo" merge --no-edit "$master_sha" >/dev/null
expect skip "preview merge of master into package PR" pkg-pr

# Site PR already deployed, then merges master: rebuild so the preview
# reflects the merged result.
git -C "$repo" checkout -b site-pr "$master_sha^" >/dev/null 2>&1
commit "pr website" website/docusaurus.config.ts
deployed="$(git -C "$repo" rev-parse HEAD)"
git -C "$repo" merge --no-edit "$master_sha" >/dev/null
expect build "preview merge of master into a deployed site PR" site-pr "$deployed"

# A conflict resolution in the merge commit changes the site itself.
git -C "$repo" checkout -b conflict-pr "$master_sha^" >/dev/null 2>&1
commit "pr index" website/src/pages/index.js
conflict_deployed="$(git -C "$repo" rev-parse HEAD)"
git -C "$repo" merge --no-edit "$master_sha" >/dev/null 2>&1 || true
printf 'resolved\n' >"$repo/website/src/pages/index.js"
git -C "$repo" commit -qam "merge master" >/dev/null
expect build "preview merge with a site conflict resolution" conflict-pr "$conflict_deployed"

# Site PR that has never deployed, merged with master: still build.
git -C "$repo" checkout -B site-pr-fresh "$deployed" >/dev/null 2>&1
git -C "$repo" merge --no-edit "$master_sha" >/dev/null
expect build "preview merge of a site PR with no prior deploy" site-pr-fresh

# Merging another feature branch (not upstream) brings its site changes in.
git -C "$repo" checkout -b feat-docs "$deployed" >/dev/null 2>&1
commit "stacked docs" docs/core/api/Stacked.md
git -C "$repo" checkout -b feat "$deployed" >/dev/null 2>&1
commit "feat pkg" packages/core/src/feat.ts
git -C "$repo" merge --no-edit feat-docs >/dev/null
expect build "preview merge of a non-upstream branch with site changes" feat "$deployed"

# No merge-base with master (e.g. shallow history): the tip alone can't prove
# the site is unchanged, so build.
git -C "$repo" checkout --orphan unrelated >/dev/null 2>&1
commit "unrelated site" website/src/pages/index.js
commit "unrelated pkg" packages/core/src/index.ts
expect build "preview without merge-base builds" unrelated

# Vercel's clone can carry a master ref at the commit being built. Comparing
# HEAD with itself would always skip, so that ref is not a base.
git -C "$repo" checkout -b clone-master master >/dev/null 2>&1
commit "clone-master page" docs/core/api/CloneMaster.md
real_master="$(git -C "$repo" rev-parse master)"
git -C "$repo" update-ref refs/heads/master HEAD
expect build "preview when the clone's master ref is HEAD" clone-master
git -C "$repo" update-ref refs/heads/master "$real_master"

# gh-pages branches never build, even if website files differ.
expect skip "gh-pages branch" gh-pages-bench

# Last production deploy is outside the clone (shallow history): the tip
# alone can't prove earlier commits in the push left the site unchanged.
git -C "$repo" checkout master >/dev/null 2>&1
commit "rebase-merged docs" docs/rest/api/Rebased.md
commit "rebase-merged pkg" packages/rest/src/rebased.ts
expect build "master with unreachable previous deploy" master 0123456789abcdef0123456789abcdef01234567

# VERCEL_ENV=production uses this branch's history, not the diff against master.
# A site commit still builds; a later package-only commit does not.
commit "prod site" website/src/pages/index.js
expect build "production env site tip" other-branch "$(parent)" production
commit "prod pkg" packages/normalizr/src/index.ts
expect skip "production env package tip" other-branch "$(parent)" production

# --- Renovate previews ignore website dependency manifests and lockfiles ---
git -C "$repo" checkout -b renovate/docusaurus master >/dev/null 2>&1
commit "bump docusaurus" website/package.json
expect skip "renovate website package.json" renovate/docusaurus
expect build "renovate ref in production env" renovate/docusaurus "$(parent)" production
commit "bump lockfiles" website/yarn.lock website/examples/demo/package.json website/examples/demo/pnpm-lock.yaml
expect skip "renovate nested manifests and lockfiles since last deploy" renovate/docusaurus "$(parent)"
git -C "$repo" checkout master >/dev/null 2>&1
commit "master site for renovate" docs/core/api/Renovate.md
git -C "$repo" checkout renovate/docusaurus >/dev/null 2>&1
git -C "$repo" merge --no-edit master >/dev/null
expect skip "renovate merge of master" renovate/docusaurus
commit "renovate site source" website/src/pages/index.js
expect build "renovate with site source" renovate/docusaurus "$(parent)"

git -C "$repo" checkout -b deps master >/dev/null 2>&1
commit "manual bump" website/package.json
expect build "non-renovate website package.json" deps

git -C "$repo" checkout master >/dev/null 2>&1
commit "master bump" website/package.json website/yarn.lock
expect build "master website manifest" master "$(parent)"

echo "all vercel-ignore cases passed"
