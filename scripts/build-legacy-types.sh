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

# True when major.minor version $1 is older than $2 (pure bash, no `sort -V`).
version_lt() {
    local a_major="${1%%.*}" a_minor="${1#*.}" b_major="${2%%.*}" b_minor="${2#*.}"
    (( a_major < b_major || (a_major == b_major && a_minor < b_minor) ))
}

# Versions are listed newest first, and custom types for a version also apply
# to every version listed after it. So each output dir gets the downleveled lib,
# then earlier versions' custom types, then its own. Each output dir only
# depends on lib and src-*-types, so versions build concurrently.
build_version() {
    local version="$1"
    shift
    "$downlevel_dts" lib "ts$version" --to="$version"
    # downlevel-dts keeps `abstract new` constructor types, which need TS 4.2
    if version_lt "$version" 4.2; then
        { grep -rl --include='*.d.ts' 'abstract new (' "ts$version" || true; } | while IFS= read -r file
        do
            perl -pi -e 's/abstract new \(/new (/g' "$file"
        done
    fi
    for earlier in "$@"
    do
        copy_types "./src-$earlier-types" "./ts$version"
    done
    copy_types "./src-$version-types" "./ts$version"
}

pids=()
earlier=()
for version in "$@"
do
    build_version "$version" "${earlier[@]}" &
    pids+=($!)
    earlier+=("$version")
done

status=0
for pid in "${pids[@]}"
do
    wait "$pid" || status=1
done
exit $status
