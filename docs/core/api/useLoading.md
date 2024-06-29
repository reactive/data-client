---
title: useLoading() - Turn any promise into React State
sidebar_label: useLoading()
description: Track loading and error state of any async function.
---

import UseLoading from '../shared/\_useLoading.mdx';
import PkgInstall from '@site/src/components/PkgInstall';
import StackBlitz from '@site/src/components/StackBlitz';

# useLoading()

Helps track loading state of imperative async functions.

:::tip

[useSuspense()](./useSuspense.md) or [useDLE()](./useDLE.md) are better for GET/read endpoints.

:::

## Usage

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
export default function useLoading<
  F extends (...args: any) => Promise<any>,
>(func: F, deps: readonly any[] = []): [F, boolean];
```

## Examples

### Github pagination

<StackBlitz app="github-app" file="src/resources/Issue.tsx,src/pages/IssueList.tsx,src/pages/NextPage.tsx" view="editor" />

### Github comment form submission

<StackBlitz app="github-app" file="src/pages/IssueDetail/CreateComment.tsx,src/pages/IssueDetail/CommentForm.tsx" view="editor" />
