#!/bin/bash

# Check if at least one directory is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <version1> [version2] ..."
    exit 1
fi

# Custom types for a version also apply to every version listed after it,
# so each output dir gets (in order): earlier versions' custom types, the
# downleveled lib, then its own custom types. Each output dir only depends on
# lib and src-*-types, so versions build concurrently.
build_version() {
    local version="$1"
    shift
    for earlier in "$@"
    do
        if [ -d "./src-$earlier-types" ]; then
            yarn g:copy --up 1 "./src-$earlier-types/**/*.d.ts" "./ts$version/" || return 1
        fi
    done
    yarn g:downtypes lib "ts$version" --to="$version" || return 1
    if [ -d "./src-$version-types" ]; then
        yarn g:copy --up 1 "./src-$version-types/**/*.d.ts" "./ts$version/" || return 1
        echo "Copied ./src-$version-types to ./ts$version/"
    else
        echo "Custom types for $version not found."
    fi
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
