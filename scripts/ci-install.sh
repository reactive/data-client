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
YARN_ENABLE_IMMUTABLE_INSTALLS=false yarn install

git checkout -- package.json yarn.lock
