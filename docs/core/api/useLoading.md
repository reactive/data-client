---
title: useLoading()
---

import UseLoading from '../shared/\_useLoading.mdx';
import PkgInstall from '@site/src/components/PkgInstall';

<head>
  <title>useLoading() - Turn any promise into React State</title>
</head>

Helps track loading state of imperative async functions.

:::tip

[useSuspense()](./useSuspense.md) or [useDLE()](./useDLE.md) are better for GET/read endpoints.

:::

## Usage

<PkgInstall pkgs="@data-client/hooks" />

<UseLoading />

## Eslint

:::tip Eslint configuration

Since we use the deps list, be sure to add useLoading to the 'additionalHooks' configuration
of [react-hooks/exhaustive-deps](https://www.npmjs.com/package/eslint-plugin-react-hooks) rule if you use it.

```js
{
  "rules": {
    // ...
    "react-hooks/exhaustive-deps": ["warn", {
      "additionalHooks": "(useLoading)"
    }]
  }
}
```

:::

## Types

```typescript
export default function useLoading<F extends (...args: any) => Promise<any>>(
  func: F,
  deps: readonly any[] = [],
): [F, boolean];
```

Part of [@data-client/hooks](https://www.npmjs.com/package/@data-client/hooks)
