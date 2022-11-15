# ![🛌🎣 Rest Hooks Legacy](https://raw.githubusercontent.com/coinbase/rest-hooks/master/packages/rest-hooks/rest_hooks_logo_and_text.svg?sanitize=true)
[![CircleCI](https://circleci.com/gh/coinbase/rest-hooks/tree/master.svg?style=shield)](https://circleci.com/gh/coinbase/rest-hooks)
[![Coverage Status](https://img.shields.io/codecov/c/gh/coinbase/rest-hooks/master.svg?style=flat-square)](https://app.codecov.io/gh/coinbase/rest-hooks?branch=master)
[![npm downloads](https://img.shields.io/npm/dm/@rest-hooks/legacy.svg?style=flat-square)](https://www.npmjs.com/package/@rest-hooks/legacy)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@rest-hooks/legacy?style=flat-square)](https://bundlephobia.com/result?p=@rest-hooks/legacy)
[![npm version](https://img.shields.io/npm/v/@rest-hooks/legacy.svg?style=flat-square)](https://www.npmjs.com/package/@rest-hooks/legacy)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

[Rest Hooks](https://resthooks.io) legacy support.

<div align="center">

**[📖Read The Docs](https://resthooks.io/docs/upgrade/upgrading-to-7)**

</div>

## shapeToEndpoint

```tsx
import { shapeToEndpoint } from '@rest-hooks/legacy';

function MyComponent() {
  const endpoint: any = useMemo(() => {
    return shapeToEndpoint(fetchShape);
    // we currently don't support shape changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const mydata = useSuspense(endpoint, params);
  //...
}
```
