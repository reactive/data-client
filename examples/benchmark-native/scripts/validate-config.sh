#!/usr/bin/env bash
# Shared host-side validation for collect-report / run-matrix.
# Usage: source scripts/validate-config.sh && validate_host_config KIND PATTERN COUNT CONTROL SAMPLES

validate_host_config() {
  local kind="${1:-}"
  local pattern="${2:-}"
  local count="${3:-}"
  local control="${4:-}"
  local samples="${5:-1}"

  case "${kind}" in
    entity|endpoint|mixed) ;;
    *)
      echo "error: invalid CANDIDATE_KIND=${kind}; expected entity|endpoint|mixed" >&2
      return 1
      ;;
  esac

  case "${pattern}" in
    unique|duplicate) ;;
    *)
      echo "error: invalid PATTERN=${pattern}; expected unique|duplicate" >&2
      return 1
      ;;
  esac

  case "${control}" in
    gc|no-gc) ;;
    *)
      echo "error: invalid CONTROL=${control}; expected gc|no-gc" >&2
      return 1
      ;;
  esac

  case "${count}" in
    1000|10000|100000) ;;
    *)
      echo "error: invalid COUNT=${count}; expected 1000|10000|100000" >&2
      return 1
      ;;
  esac

  if [[ "${pattern}" == "duplicate" && "${kind}" != "entity" ]]; then
    echo "error: duplicate pattern only supports CANDIDATE_KIND=entity (got ${kind})" >&2
    return 1
  fi

  if ! [[ "${samples}" =~ ^[0-9]+$ ]] || [[ "${samples}" -lt 1 ]] || [[ "${samples}" -gt 50 ]]; then
    echo "error: invalid SAMPLES=${samples}; expected integer 1..50" >&2
    return 1
  fi

  return 0
}
