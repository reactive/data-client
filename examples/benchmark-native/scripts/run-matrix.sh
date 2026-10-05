#!/usr/bin/env bash
# Matrix runner over the full canonical android interaction axes.
#
# Scenarios come from the shared GC protocol (examples/gc-shared), in device
# matrix order:
#   entity|endpoint|mixed × unique × {1000,10000,100000} × {gc,no-gc}
#   entity × duplicate × {1000,10000,100000} × {gc,no-gc}
#
# Safety: count=100000 is skipped unless FULL=1 or an explicit filter selects it.
#
# Usage:
#   bash scripts/run-matrix.sh
#   bash scripts/run-matrix.sh entity/unique/1000            # 1000 only, not 10k/100k
#   bash scripts/run-matrix.sh entity/unique/100000          # 100k via filter
#   bash scripts/run-matrix.sh /100000/                      # only 100k; no FULL=1
#   bash scripts/run-matrix.sh interaction/no-gc             # every no-gc control row
#   bash scripts/run-matrix.sh ^android/mixed/               # id prefix
#   FULL=1 SAMPLES=5 bash scripts/run-matrix.sh             # entire matrix incl. 100k
#
# Filters match slash-bounded contiguous segments of the stable id
# android/{kind}/{pattern}/{count}/interaction/{control} (or ^prefix), not raw
# substrings. kind/pattern/count/control is not contiguous (interaction sits
# between count and control); use e.g. unique/1000/interaction/gc.
# DRY_RUN=1 prints matched specs (kind/pattern/count/control) and does not
# install or collect.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROTOCOL_CLI="${ROOT}/../gc-shared/protocol-cli.js"

FILTER="${1:-}"
OUT_DIR="${OUT_DIR:-${ROOT}/artifacts/matrix}"
SAMPLES="${SAMPLES:-1}"
INSTALL_FIRST="${INSTALL_FIRST:-1}"
FULL="${FULL:-0}"

mkdir -p "${OUT_DIR}"

# Stable ids already filtered by the shared protocol.
SCENARIO_IDS=()
while IFS= read -r id; do
  SCENARIO_IDS+=("${id}")
done < <(node "${PROTOCOL_CLI}" list android "${FILTER}")

install_flag=1
if [[ "${INSTALL_FIRST}" != "1" ]]; then
  install_flag=0
fi

ran=0
skipped_100k=0
for id in ${SCENARIO_IDS[@]+"${SCENARIO_IDS[@]}"}; do
  IFS='/' read -r _platform kind pattern count _mode control <<<"${id}"
  spec="${kind}/${pattern}/${count}/${control}"

  # 100k safety: require FULL=1, or an explicit filter that selected this row.
  if [[ "${count}" == "100000" && "${FULL}" != "1" && -z "${FILTER}" ]]; then
    skipped_100k=$((skipped_100k + 1))
    continue
  fi

  if [[ "${DRY_RUN:-0}" == "1" ]]; then
    echo "${spec}"
    ran=$((ran + 1))
    continue
  fi

  node "${PROTOCOL_CLI}" validate "${kind}" "${pattern}" "${count}" "${control}" "${SAMPLES}"

  echo "=== matrix ${kind}/${pattern}/${count}/interaction/${control} ==="
  OUT="${OUT_DIR}/android-${kind}-${pattern}-${count}-interaction-${control}.json" \
  CANDIDATE_KIND="${kind}" \
  PATTERN="${pattern}" \
  COUNT="${count}" \
  CONTROL="${control}" \
  SAMPLES="${SAMPLES}" \
  INSTALL="${install_flag}" \
  bash "${ROOT}/scripts/collect-report.sh"
  install_flag=0
  ran=$((ran + 1))
done

if [[ "${ran}" -eq 0 ]]; then
  echo "error: no scenarios matched (filter=${FILTER:-<none>} FULL=${FULL})" >&2
  echo "hint: FULL=1 includes all 100k rows; or filter e.g. entity/unique/100000" >&2
  exit 1
fi

if [[ "${skipped_100k}" -gt 0 ]]; then
  echo "note: skipped ${skipped_100k} × 100k scenarios (set FULL=1 or pass a 100k filter)"
fi

echo "Matrix complete (${ran} scenarios) → ${OUT_DIR}"
