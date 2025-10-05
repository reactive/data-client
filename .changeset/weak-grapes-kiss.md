---
'@data-client/endpoint': patch
'@data-client/rest': patch
'@data-client/graphql': patch
---

Unions can query() without type discriminator

#### Before
```tsx
// @ts-expect-error
const event = useQuery(EventUnion, { id });
// event is undefined
const newsEvent = useQuery(EventUnion, { id, type: 'news' });
// newsEvent is found
```

#### After

```tsx
const event = useQuery(EventUnion, { id });
// event is found
const newsEvent = useQuery(EventUnion, { id, type: 'news' });
// newsEvent is found
```