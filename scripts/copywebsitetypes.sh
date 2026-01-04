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
cp ./node_modules/@js-temporal/polyfill/index.d.ts ./website/src/components/Playground/editor-types/temporal.d.ts
cp ./node_modules/bignumber.js/bignumber.d.ts ./website/src/components/Playground/editor-types/bignumber.d.ts
cp ./node_modules/@types/qs/index.d.ts ./website/src/components/Playground/editor-types/qs.d.ts
yarn run rollup --config ./scripts/rollup-plugins/uuid-types.rollup.config.js
cp ./node_modules/@number-flow/react/dist/index.d.ts ./website/src/components/Playground/editor-types/@number-flow/react.d.ts
rm ./website/src/components/Playground/editor-types/globals.d.ts
yarn run rollup --config ./scripts/rollup-plugins/globals.rollup.config.js