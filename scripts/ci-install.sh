#!/bin/bash
# Installs only the workspaces needed for a CI job, then restores
# package.json and yarn.lock so later steps never see a dirty tree.
#
# Usage: scripts/ci-install.sh [extra-workspace ...]
#   Always includes packages/* and scripts/rollup-plugins.
#   Pass additional workspace paths as arguments.
#
# Examples:
#   scripts/ci-install.sh                        # release / beta-release
#   scripts/ci-install.sh examples/benchmark     # node benchmark
set -euo pipefail

WORKSPACES='["packages/*","scripts/rollup-plugins"'
for ws in "$@"; do
  WORKSPACES+=',"'"$ws"'"'
done
WORKSPACES+=']'

node -e "
  const f = 'package.json';
  const p = JSON.parse(require('fs').readFileSync(f, 'utf8'));
  p.workspaces = $WORKSPACES;
  require('fs').writeFileSync(f, JSON.stringify(p, null, 2) + '\n');
"
corepack enable

# On public PRs Yarn's hardened mode re-resolves every lockfile entry against
# the registry (~13s) to catch a tampered yarn.lock. A lockfile identical to
# the base branch's has nothing to catch. Fails open: hardened mode stays on
# when the base can't be read.
if [ "${GITHUB_EVENT_NAME:-}" = pull_request ]; then
  base="$(node -p "require(process.env.GITHUB_EVENT_PATH).pull_request.base.sha")"
  git cat-file -e "$base^{commit}" 2>/dev/null \
    || git fetch -q --depth=1 --filter=blob:none origin "$base" || true
  if [ "$(git rev-parse -q --verify "$base:yarn.lock")" = "$(git rev-parse HEAD:yarn.lock)" ]; then
    export YARN_ENABLE_HARDENED_MODE=0
  fi
fi
YARN_ENABLE_IMMUTABLE_INSTALLS=false yarn install

git checkout -- package.json yarn.lock
