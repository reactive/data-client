#!/bin/bash
set -e

# Check if at least one directory is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <version1> [version2] ..."
    exit 1
fi

# Called directly (not via `yarn g:*`) to skip a yarn boot per step.
downlevel_dts="$(dirname "$0")/../node_modules/.bin/downlevel-dts"

# Custom types for a version also apply to every version listed after it,
# so each output dir gets (in order): earlier versions' custom types, the
# downleveled lib, then its own custom types. Each output dir only depends on
# lib and src-*-types, so versions build concurrently.
build_version() {
    local version="$1"
    shift
    mkdir -p "./ts$version"
    for earlier in "$@"
    do
        if [ -d "./src-$earlier-types" ]; then
            cp -R "./src-$earlier-types/." "./ts$version/"
        fi
    done
    "$downlevel_dts" lib "ts$version" --to="$version"
    if [ -d "./src-$version-types" ]; then
        cp -R "./src-$version-types/." "./ts$version/"
    fi
}

# LEGACY_MIN_TS skips outputs no consumer reads (CI's oldest tested TS).
below_min() {
    [ -n "$LEGACY_MIN_TS" ] && [ "$1" != "$LEGACY_MIN_TS" ] \
        && [ "$(printf '%s\n' "$1" "$LEGACY_MIN_TS" | sort -V | head -1)" = "$1" ]
}

pids=()
earlier=()
for version in "$@"
do
    if ! below_min "$version"; then
        build_version "$version" "${earlier[@]}" &
        pids+=($!)
    fi
    earlier+=("$version")
done

status=0
for pid in "${pids[@]}"
do
    wait "$pid" || status=1
done
exit $status
