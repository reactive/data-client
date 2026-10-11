# Sourced by release.yml, docs-snapshot.yml, cut.sh and publish.sh (cut.sh
# copies it to the branch). A release line is what a breaking change starts:
# the minor for 0.x, else the major. Docs archive and npm tag by line;
# website/siteVersions.ts checks the same shape.

# The line a version belongs to: 0.18.2 -> 0.18, 1.0.0-beta.1 -> 1
line() {
  local v="${1%%-*}"
  [[ "$v" == 0.* ]] && echo "${v%.*}" || echo "${v%%.*}"
}

# Whether $1 names a line
is_line() { [[ "$1" =~ ^(0\.[0-9]+|[1-9][0-9]*)$ ]]; }

# The line a stable release replaces at the root, when it's the first stable
# release of a new line: the line master was ahead of (versionCurrent.json's
# version), else the previous version's. Prints nothing if it replaces none,
# and fails if the previous version is a prerelease with no current line.
#   replaced_line <previous version> <released version> [current line]
replaced_line() {
  local old="$1" new="$2" prev="${3:-}"
  # not a new stable release
  if [ "$old" = "$new" ] || [[ "$new" == *-* ]]; then return 0; fi
  # a later stable release of the same line
  if [[ "$old" != *-* ]] && [ "$(line "$old")" = "$(line "$new")" ]; then return 0; fi
  if [ -z "$prev" ]; then
    # a prerelease doesn't say which line came before it
    if [[ "$old" == *-* ]]; then return 1; fi
    prev="$(line "$old")"
  fi
  if [ "$prev" != "$(line "$new")" ]; then echo "$prev"; fi
}
