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

<<<<<<< HEAD
# True when version $1 is older than version $2.
version_lt() {
    [ "$1" != "$2" ] && [ "$(printf '%s\n' "$1" "$2" | sort -V | head -1)" = "$1" ]
}

=======
>>>>>>> origin/claude/project-thread-bw2hx0
# Versions are listed newest first, and custom types for a version also apply
# to every version listed after it. So each output dir gets the downleveled lib,
# then earlier versions' custom types, then its own. Each output dir only
# depends on lib and src-*-types, so versions build concurrently.
build_version() {
    local version="$1"
    shift
    "$downlevel_dts" lib "ts$version" --to="$version"
<<<<<<< HEAD
    # downlevel-dts keeps `abstract new` constructor types, which need TS 4.2
    if version_lt "$version" 4.2; then
        grep -rl --include='*.d.ts' 'abstract new (' "ts$version" | while IFS= read -r file
        do
            perl -pi -e 's/abstract new \(/new (/g' "$file"
        done
    fi
=======
>>>>>>> origin/claude/project-thread-bw2hx0
    for earlier in "$@"
    do
        copy_types "./src-$earlier-types" "./ts$version"
    done
    copy_types "./src-$version-types" "./ts$version"
}

# LEGACY_MIN_TS skips outputs no consumer reads (CI's oldest tested TS).
below_min() {
    [ -n "$LEGACY_MIN_TS" ] && version_lt "$1" "$LEGACY_MIN_TS"
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
