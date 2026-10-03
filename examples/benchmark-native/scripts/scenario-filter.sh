# Slash-bounded scenario filter shared by run-matrix.sh.
#
# Empty filter matches every spec. One leading slash and one trailing slash
# are removed, so /100000/ matches the 100000 segment only.
# The remaining text must be a contiguous run of spec segments:
# entity/unique/1000 matches entity/unique/1000/gc and not entity/unique/10000/gc.
scenario_filter_matches() {
  local spec="$1"
  local filter="${2:-}"
  if [[ -z "${filter}" ]]; then
    return 0
  fi
  filter="${filter#/}"
  filter="${filter%/}"
  if [[ -z "${filter}" ]]; then
    return 0
  fi
  [[ "/${spec}/" == *"/${filter}/"* ]]
}
