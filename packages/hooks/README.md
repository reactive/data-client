# TypeScript Standard Endpoints
[![CircleCI](https://circleci.com/gh/coinbase/rest-hooks.svg?style=shield)](https://circleci.com/gh/coinbase/rest-hooks)
[![Coverage Status](https://img.shields.io/coveralls/coinbase/rest-hooks.svg?style=flat-square)](https://coveralls.io/github/coinbase/rest-hooks?branch=master)
[![npm downloads](https://img.shields.io/npm/dm/@rest-hooks/hooks.svg?style=flat-square)](https://www.npmjs.com/package/@rest-hooks/hooks)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@rest-hooks/hooks?style=flat-square)](https://bundlephobia.com/result?p=@rest-hooks/hooks)
[![npm version](https://img.shields.io/npm/v/@rest-hooks/hooks.svg?style=flat-square)](https://www.npmjs.com/package/@rest-hooks/hooks)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

Composable hooks for networking data

<div align="center">

**[📖Read The Docs](https://resthooks.io/docs/api/Endpoint)**

</div>

### useCancelling()

```typescript
const data = useResource(useCancelling(MyEndpoint, { filter }), { filter });
```

### useDebounce()

```typescript
const debouncedFilter = useDebounce(filter, 200);
const data = useResource(MyEndpoint, { filter: debouncedFilter });
```
