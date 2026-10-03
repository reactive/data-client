#!/bin/bash
set -e

# Check if at least one directory is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <version1> [version2] ..."
    exit 1
fi

# Called directly (not via `yarn g:*`) to skip a yarn boot per step.
downlevel_dts="$(dirname "$0")/../node_modules/.bin/downlevel-dts"

# Copies only the .d.ts files under src dir $1 into $2 (ts* dirs are published).
copy_types() {
    [ -d "$1" ] || return 0
    (cd "$1" && find . -name '*.d.ts') | while IFS= read -r file
    do
        mkdir -p "$2/$(dirname "$file")"
        cp "$1/$file" "$2/$file"
    done
}

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
        copy_types "./src-$earlier-types" "./ts$version"
    done
    "$downlevel_dts" lib "ts$version" --to="$version"
    copy_types "./src-$version-types" "./ts$version"
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
