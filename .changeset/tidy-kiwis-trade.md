---
'@data-client/core': minor
'@data-client/react': minor
'@rest-hooks/core': minor
'@rest-hooks/react': minor
---

Add controller.fetchIfStale()

Fetches only if endpoint is considered '[stale](../concepts/expiry-policy.md#stale)'; otherwise returns undefined.

This can be useful when prefetching data, as it avoids overfetching fresh data.

An [example](https://stackblitz.com/github/data-client/rest-hooks/tree/master/examples/github-app?file=src%2Frouting%2Froutes.tsx) with a fetch-as-you-render router:

```ts
{
  name: 'IssueList',
  component: lazyPage('IssuesPage'),
  title: 'issue list',
  resolveData: async (
    controller: Controller,
    { owner, repo }: { owner: string; repo: string },
    searchParams: URLSearchParams,
  ) => {
    const q = searchParams?.get('q') || 'is:issue is:open';
    await controller.fetchIfStale(IssueResource.search, {
      owner,
      repo,
      q,
    });
  },
},
```