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
