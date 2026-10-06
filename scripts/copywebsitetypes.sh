#!/bin/sh
# Regenerates the playground editor's types (website/src/components/Playground/editor-types)
# from our packages' tsc output (`yarn ci:build:types`) and the installed dependencies.
# Committed under website/ so type changes also trigger the site deploy; CI fails if they're stale.
set -e
cp ./node_modules/@types/react/index.d.ts ./website/src/components/Playground/editor-types/react.d.ts
node ./scripts/strip-dts-comments.mjs ./node_modules/csstype/index.d.ts ./website/src/components/Playground/editor-types/csstype.d.ts
# ambient module declarations can't use relative imports
sed 's#from "\./"#from "react"#' ./node_modules/@types/react/jsx-runtime.d.ts > ./website/src/components/Playground/editor-types/react-jsx-runtime.d.ts
cp ./node_modules/temporal-spec/index.d.ts ./website/src/components/Playground/editor-types/temporal.d.ts
cp ./node_modules/bignumber.js/dist/bignumber.d.mts ./website/src/components/Playground/editor-types/bignumber.d.ts
cp ./node_modules/@types/qs/index.d.ts ./website/src/components/Playground/editor-types/qs.d.ts
cp ./node_modules/path-to-regexp/dist/index.d.ts ./website/src/components/Playground/editor-types/path-to-regexp.d.ts
rm -f ./website/src/components/Playground/editor-types/globals.d.ts
yarn run rollup --config ./scripts/rollup-plugins/editor-types.rollup.config.js
