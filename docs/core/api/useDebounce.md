---
title: useDebounce()
---

import PkgInstall from '@site/src/components/PkgInstall';
import HooksPlayground from '@site/src/components/HooksPlayground';

<head>
  <title>useDebounce() - Declarative value delays for React</title>
</head>

Delays updating the parameters by [debouncing](https://css-tricks.com/debouncing-throttling-explained-examples/).

Useful to avoid spamming network requests when parameters might change quickly (like a typeahead field).

## Usage

<PkgInstall pkgs="@data-client/hooks" />

<HooksPlayground row>

```ts title="IssueQuery" collapsed
import { RestEndpoint, Entity, schema } from '@data-client/rest';

export class Issue extends Entity {
  number = 0;
  repository_url = '';
  labels_url = '';
  html_url = '';
  body = '';
  title = '';
  state: 'open' | 'closed' = 'open';
  locked = false;
  comments = 0;
  created_at = Temporal.Instant.fromEpochSeconds(0);
  updated_at = Temporal.Instant.fromEpochSeconds(0);
  closed_at: Temporal.Instant | null = null;
  authorAssociation = 'NONE';
  pullRequest: Record<string, any> | null = null;
  declare draft?: boolean;

  static schema = {
    created_at: Temporal.Instant.from,
    updated_at: Temporal.Instant.from,
    closed_at: Temporal.Instant.from,
  };

  pk() {
    return [this.repository_url, this.number].join(',');
  }
}

export const issueQuery = new RestEndpoint({
  urlPrefix: 'https://api.github.com',
  path: '/search/issues\\?q=:q?%20repo\\::owner/:repo&page=:page?',
  schema: {
    incomplete_results: false,
    items: new schema.Collection([Issue]),
    total_count: 0,
  },
});
```

```tsx title="IssueList" collapsed
import { useSuspense } from '@data-client/react';
import { issueQuery } from './IssueQuery';

function IssueList({ q, owner, repo }) {
  const response = useSuspense(issueQuery, { q, owner, repo });
  return (
    <div>
      <small>{response.total_count} results</small>
      {response.items.slice(0, 5).map(issue => (
        <div key={issue.pk()}>
          <a href={issue.html_url} target="_blank">
            {issue.title}
          </a>
        </div>
      ))}
    </div>
  );
}
export default React.memo(IssueList) as typeof IssueList;
```

```tsx title="SearchIssues" {8}
import { useDebounce } from '@data-client/hooks';
import { AsyncBoundary } from '@data-client/react';
import IssueList from './IssueList';

export default function SearchIssues() {
  const [query, setQuery] = React.useState('');
  const handleChange = e => setQuery(e.currentTarget.value);
  const debouncedQuery = useDebounce(query, 200);
  return (
    <div>
      <label>
        Query:{' '}
        <input type="text" value={query} onChange={handleChange} />
      </label>
      <AsyncBoundary fallback={<div>searching...</div>}>
        <IssueList q={debouncedQuery} owner="facebook" repo="react" />
      </AsyncBoundary>
    </div>
  );
}
render(<SearchIssues />);
```

</HooksPlayground>

## Types

```typescript
function useDebounce<T>(value: T, delay: number, updatable?: boolean): T;
```

Part of [@data-client/hooks](https://www.npmjs.com/package/@data-client/hooks)
