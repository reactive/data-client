#!/usr/bin/env bash
# Exercises website/scripts/vercel-ignore.sh against a throwaway repo.
set -euo pipefail

root="$(cd "$(dirname "$0")/../.." && pwd)"
script="$root/website/scripts/vercel-ignore.sh"
node "$root/website/scripts/vercel-ignore-decide.js" self-test
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

write_commit() {
  local msg="$1" path="$2"
  mkdir -p "$repo/$(dirname "$path")"
  cat >"$repo/$path"
  git -C "$repo" add -- "$path"
  git -C "$repo" commit -q -m "$msg"
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

# --- renovate previews and the yarn prepare / InteractionManager failure ---
# react-native 0.87 removed InteractionManager. yarn prepare (tsc --build)
# then exits 2, which is the Vercel install command's status. Baseline keeps
# 0.86 so the Renovate rule and the prepare-failure rule can be told apart.
git -C "$repo" checkout master >/dev/null 2>&1
write_commit "rn baseline" package.json <<'JSON'
{
  "devDependencies": {
    "react-native": "0.86.2"
  }
}
JSON
write_commit "website deps" website/package.json <<'JSON'
{
  "dependencies": {
    "monaco-editor": "^0.56.0",
    "@typescript/native": "npm:typescript@7.0.2"
  },
  "devDependencies": {
    "@types/react": "19.2.17"
  }
}
JSON
write_commit "native hook" packages/react/src/hooks/useFetch.native.ts <<'TS'
import { InteractionManager } from 'react-native';
TS
baseline="$(git -C "$repo" rev-parse HEAD)"

git -C "$repo" checkout -b renovate/all-minor-patch "$baseline" >/dev/null 2>&1
write_commit "pkg: minor website deps" website/package.json <<'JSON'
{
  "dependencies": {
    "monaco-editor": "^0.57.0",
    "@typescript/native": "npm:typescript@7.0.2"
  },
  "devDependencies": {
    "@types/react": "19.3.0"
  }
}
JSON
expect skip "renovate minor and patch website deps" renovate/all-minor-patch

minor_sha="$(git -C "$repo" rev-parse HEAD)"
write_commit "docs page on renovate" docs/core/api/Controller.md <<'MD'
# Controller
MD
expect build "renovate docs after a minor bump" renovate/all-minor-patch "$minor_sha"

docs_sha="$(git -C "$repo" rev-parse HEAD)"
write_commit "pkg: another patch" website/package.json <<'JSON'
{
  "dependencies": {
    "monaco-editor": "^0.57.1",
    "@typescript/native": "npm:typescript@7.0.2"
  },
  "devDependencies": {
    "@types/react": "19.3.0"
  }
}
JSON
expect skip "renovate patch after a site deploy" renovate/all-minor-patch "$docs_sha"

git -C "$repo" checkout -b renovate/major "$baseline" >/dev/null 2>&1
write_commit "pkg: major website dep" website/package.json <<'JSON'
{
  "dependencies": {
    "monaco-editor": "^1.0.0",
    "@typescript/native": "npm:typescript@7.0.2"
  },
  "devDependencies": {
    "@types/react": "19.2.17"
  }
}
JSON
expect build "renovate major website dependency" renovate/major

git -C "$repo" checkout -b renovate/dev-major "$baseline" >/dev/null 2>&1
write_commit "pkg: major website devDep" website/package.json <<'JSON'
{
  "dependencies": {
    "monaco-editor": "^0.56.0",
    "@typescript/native": "npm:typescript@7.0.2"
  },
  "devDependencies": {
    "@types/react": "20.0.0"
  }
}
JSON
expect build "renovate major website devDependency" renovate/dev-major

git -C "$repo" checkout -b renovate/alias "$baseline" >/dev/null 2>&1
write_commit "pkg: major npm alias" website/package.json <<'JSON'
{
  "dependencies": {
    "monaco-editor": "^0.56.0",
    "@typescript/native": "npm:typescript@8.0.0"
  },
  "devDependencies": {
    "@types/react": "19.2.17"
  }
}
JSON
expect build "renovate major npm alias" renovate/alias

git -C "$repo" checkout -b renovate/resolution "$baseline" >/dev/null 2>&1
write_commit "pkg: major resolution" website/package.json <<'JSON'
{
  "dependencies": {
    "monaco-editor": "^0.56.0",
    "@typescript/native": "npm:typescript@7.0.2"
  },
  "devDependencies": {
    "@types/react": "19.2.17"
  },
  "resolutions": {
    "serialize-javascript": "8.0.0"
  }
}
JSON
expect build "renovate major website resolution" renovate/resolution

git -C "$repo" checkout -b renovate/added "$baseline" >/dev/null 2>&1
write_commit "pkg: add website dep" website/package.json <<'JSON'
{
  "dependencies": {
    "monaco-editor": "^0.56.0",
    "@typescript/native": "npm:typescript@7.0.2",
    "left-pad": "1.0.0"
  },
  "devDependencies": {
    "@types/react": "19.2.17"
  }
}
JSON
expect build "renovate added website dependency" renovate/added

git -C "$repo" checkout -b renovate/scripts "$baseline" >/dev/null 2>&1
write_commit "pkg: website script" website/package.json <<'JSON'
{
  "scripts": {
    "build": "docusaurus build"
  },
  "dependencies": {
    "monaco-editor": "^0.57.0",
    "@typescript/native": "npm:typescript@7.0.2"
  },
  "devDependencies": {
    "@types/react": "19.2.17"
  }
}
JSON
expect build "renovate website package.json script change" renovate/scripts

git -C "$repo" checkout -b renovate/lock "$baseline" >/dev/null 2>&1
write_commit "pkg: website lock" website/yarn.lock <<'LOCK'
# lock 1
LOCK
expect skip "renovate website lockfile only" renovate/lock

# Master gained site commits, then a Renovate branch with only a minor bump
# merges master. The preview diff is the branch, not the incoming site commit.
git -C "$repo" checkout master >/dev/null 2>&1
write_commit "master site moves again" website/src/pages/index.js <<'JS'
export default function Home() {}
JS
moved="$(git -C "$repo" rev-parse HEAD)"
git -C "$repo" checkout -b renovate/merged "$baseline" >/dev/null 2>&1
write_commit "pkg: minor before merge" website/package.json <<'JSON'
{
  "dependencies": {
    "monaco-editor": "^0.57.0",
    "@typescript/native": "npm:typescript@7.0.2"
  },
  "devDependencies": {
    "@types/react": "19.2.17"
  }
}
JSON
git -C "$repo" merge --no-edit "$moved" >/dev/null
expect skip "renovate merge of master into a minor dep branch" renovate/merged

# Non-renovate preview of a minor website bump still builds.
git -C "$repo" checkout -b feature-deps "$baseline" >/dev/null 2>&1
write_commit "human minor website dep" website/package.json <<'JSON'
{
  "dependencies": {
    "monaco-editor": "^0.57.0",
    "@typescript/native": "npm:typescript@7.0.2"
  },
  "devDependencies": {
    "@types/react": "19.2.17"
  }
}
JSON
expect build "preview non-renovate minor website dep" feature-deps

# react-native 0.87 plus the import: yarn prepare exits 2. Manifest-only
# previews skip. Site source, docs, and production still build.
git -C "$repo" checkout -b renovate/rn "$baseline" >/dev/null 2>&1
cat >"$repo/package.json" <<'JSON'
{
  "devDependencies": {
    "react-native": "0.87.1"
  }
}
JSON
cat >"$repo/website/package.json" <<'JSON'
{
  "dependencies": {
    "monaco-editor": "^0.57.0",
    "@typescript/native": "npm:typescript@7.0.2"
  },
  "devDependencies": {
    "@types/react": "19.3.0"
  }
}
JSON
git -C "$repo" add -- package.json website/package.json
git -C "$repo" commit -q -m "pkg: Update all non-major dependencies"
expect skip "renovate minor with prepare failure" renovate/rn

git -C "$repo" checkout -b renovate/rn-major "$baseline" >/dev/null 2>&1
cat >"$repo/package.json" <<'JSON'
{
  "devDependencies": {
    "react-native": "0.87.1"
  }
}
JSON
cat >"$repo/website/package.json" <<'JSON'
{
  "dependencies": {
    "monaco-editor": "^1.0.0",
    "@typescript/native": "npm:typescript@7.0.2"
  },
  "devDependencies": {
    "@types/react": "19.2.17"
  }
}
JSON
git -C "$repo" add -- package.json website/package.json
git -C "$repo" commit -q -m "pkg: major website dep on rn 0.87"
expect skip "renovate major skipped when prepare will fail" renovate/rn-major

write_commit "docs beside broken prepare" docs/rest/api/Entity.md <<'MD'
# Entity
MD
expect build "renovate docs still build when prepare will fail" renovate/rn-major

git -C "$repo" checkout -b feature-broken "$baseline" >/dev/null 2>&1
cat >"$repo/package.json" <<'JSON'
{
  "devDependencies": {
    "react-native": "0.87.0"
  }
}
JSON
cat >"$repo/website/package.json" <<'JSON'
{
  "dependencies": {
    "monaco-editor": "^0.57.0",
    "@typescript/native": "npm:typescript@7.0.2"
  },
  "devDependencies": {
    "@types/react": "19.2.17"
  }
}
JSON
git -C "$repo" add -- package.json website/package.json
git -C "$repo" commit -q -m "bump rn and a website dep"
expect skip "preview manifest-only prepare failure" feature-broken

write_commit "multiline import" packages/react/src/hooks/useFetch.native.ts <<'TS'
import {
  InteractionManager,
} from 'react-native';
TS
write_commit "manifest follow-up" website/package.json <<'JSON'
{
  "dependencies": {
    "monaco-editor": "^0.57.1",
    "@typescript/native": "npm:typescript@7.0.2"
  },
  "devDependencies": {
    "@types/react": "19.2.17"
  }
}
JSON
expect skip "preview prepare failure with a multiline import" feature-broken "$(git -C "$repo" rev-parse HEAD^)"

write_commit "playground source beside broken prepare" website/src/components/Playground/transformCode.ts <<'TS'
export const code = 1;
TS
expect build "preview site source still builds when prepare would fail" feature-broken "$(git -C "$repo" rev-parse HEAD^)"

git -C "$repo" checkout -b feature-fixed "$baseline" >/dev/null 2>&1
cat >"$repo/package.json" <<'JSON'
{
  "devDependencies": {
    "react-native": "0.87.1"
  }
}
JSON
cat >"$repo/website/package.json" <<'JSON'
{
  "dependencies": {
    "monaco-editor": "^0.57.0",
    "@typescript/native": "npm:typescript@7.0.2"
  },
  "devDependencies": {
    "@types/react": "19.2.17"
  }
}
JSON
mkdir -p "$repo/packages/react/src/hooks"
printf '%s\n' 'export const task = 1;' >"$repo/packages/react/src/hooks/useFetch.native.ts"
git -C "$repo" add -- package.json website/package.json packages/react/src/hooks/useFetch.native.ts
git -C "$repo" commit -q -m "rn 0.87 and drop InteractionManager"
expect build "preview minor website dep builds once the import is gone" feature-fixed

# Production keeps building website manifest changes, even when prepare
# would fail and even when the ref looks like Renovate.
git -C "$repo" checkout master >/dev/null 2>&1
cat >"$repo/package.json" <<'JSON'
{
  "devDependencies": {
    "react-native": "0.87.1"
  }
}
JSON
cat >"$repo/website/package.json" <<'JSON'
{
  "dependencies": {
    "monaco-editor": "^0.57.0",
    "@typescript/native": "npm:typescript@7.0.2"
  },
  "devDependencies": {
    "@types/react": "19.3.0"
  }
}
JSON
git -C "$repo" add -- package.json website/package.json
git -C "$repo" commit -q -m "master website deps"
expect build "master website deps still build when prepare would fail" master "$(parent)"
expect build "production env renovate ref still builds" renovate/all-minor-patch "$(parent)" production

echo "all vercel-ignore cases passed"
