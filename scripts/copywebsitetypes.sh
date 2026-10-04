cp ./packages/core/index.d.ts ./website/src/components/Playground/editor-types/@data-client/core.d.ts
cp ./packages/endpoint/index.d.ts ./website/src/components/Playground/editor-types/@data-client/endpoint.d.ts
cp ./packages/graphql/index.d.ts ./website/src/components/Playground/editor-types/@data-client/graphql.d.ts
cp ./packages/normalizr/index.d.ts ./website/src/components/Playground/editor-types/@data-client/normalizr.d.ts
cp ./packages/react/index.d.ts ./website/src/components/Playground/editor-types/@data-client/react.d.ts
cp ./packages/rest/index.d.ts ./website/src/components/Playground/editor-types/@data-client/rest.d.ts
mkdir -p ./website/src/components/Playground/editor-types/@data-client/rest
mkdir -p ./website/src/components/Playground/editor-types/@data-client/core
mkdir -p ./website/src/components/Playground/editor-types/@data-client/react
cp ./packages/rest/next.d.ts ./website/src/components/Playground/editor-types/@data-client/rest/next.d.ts
cp ./packages/core/next.d.ts ./website/src/components/Playground/editor-types/@data-client/core/next.d.ts
cp ./packages/react/next.d.ts ./website/src/components/Playground/editor-types/@data-client/react/next.d.ts
cp ./packages/react/nextjs.d.ts ./website/src/components/Playground/editor-types/@data-client/react/nextjs.d.ts
cp ./packages/react/ssr.d.ts ./website/src/components/Playground/editor-types/@data-client/react/ssr.d.ts
cp ./packages/react/redux.d.ts ./website/src/components/Playground/editor-types/@data-client/react/redux.d.ts
cp ./node_modules/@types/react/index.d.ts ./website/src/components/Playground/editor-types/react.d.ts
node ./scripts/strip-dts-comments.mjs ./node_modules/csstype/index.d.ts ./website/src/components/Playground/editor-types/csstype.d.ts
# ambient module declarations can't use relative imports
sed 's#from "\./"#from "react"#' ./node_modules/@types/react/jsx-runtime.d.ts > ./website/src/components/Playground/editor-types/react-jsx-runtime.d.ts
cp ./node_modules/temporal-spec/index.d.ts ./website/src/components/Playground/editor-types/temporal.d.ts
cp ./node_modules/bignumber.js/dist/bignumber.d.mts ./website/src/components/Playground/editor-types/bignumber.d.ts
cp ./node_modules/@types/qs/index.d.ts ./website/src/components/Playground/editor-types/qs.d.ts
cp ./node_modules/path-to-regexp/dist/index.d.ts ./website/src/components/Playground/editor-types/path-to-regexp.d.ts
yarn run rollup --config ./scripts/rollup-plugins/editor-types.rollup.config.js
rm ./website/src/components/Playground/editor-types/globals.d.ts
yarn run rollup --config ./scripts/rollup-plugins/globals.rollup.config.js