#!/usr/bin/env bash
# Exercises scripts/maintenance/version-line.sh
set -euo pipefail
source "$(dirname "$0")/version-line.sh"

failed=0
expect() {
  local want="$1" got
  shift
  got="$("$@" 2>&1)" || got="$got(failed)"
  [ "$got" = "$want" ] || { echo "FAIL: $* gave '$got', want '$want'"; failed=1; }
}

expect 0.18 line 0.18.2
expect 0.19 line 0.19.0-beta.0
expect 1 line 1.0.0-rc.1
expect 2 line 2.3.4
for v in 0.18 1 12; do expect '' is_line "$v"; done
for v in 0 1.2 01 0.18.1 v1; do expect '(failed)' is_line "$v"; done

# previous, released, current line -> the line it replaces
expect 0.18 replaced_line 0.18.2 0.19.0
expect 0.18 replaced_line 0.18.2 0.19.0 0.18
expect 0.18 replaced_line 0.19.0-beta.3 0.19.0 0.18
expect 0.9 replaced_line 0.9.9 1.0.0
expect '' replaced_line 0.18.1 0.18.2
expect '' replaced_line 0.18.2 0.18.3 0.18
expect '' replaced_line 0.18.2 0.19.0-beta.0 0.18
# a patch after the major, before its archive is listed
expect '' replaced_line 0.19.0 0.19.1 0.18
# no new version this push
expect '' replaced_line 0.19.0 0.19.0 0.18
# a prerelease, with nothing to say what it followed
expect '(failed)' replaced_line 0.19.0-beta.3 0.19.0

[ "$failed" = 0 ] && echo "version-line.sh: all passed"
exit "$failed"
