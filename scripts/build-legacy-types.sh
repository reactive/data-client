#!/bin/bash

# Check if at least one directory is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <version1> [version2] ..."
    exit 1
fi

destinations=("$@")
# Loop through all provided arguments
for version in "$@"
do
   yarn g:downtypes lib "ts$version" --to="$version"
    # Check if custom type file directory exists
    if [ -d "./src-$version-types" ]; then
        for dest in "${destinations[@]}"
        do
            yarn g:copy --up 1 "./src-$version-types/**/*.d.ts" "./ts$dest/"
            echo "Copied ./src-$version-types to ./ts$dest/"
        done
    else
        echo "Custom types for $version not found."
    fi
    # this is how you pop the first element off
    unset destinations[0]
    destinations=("${destinations[@]}")
done