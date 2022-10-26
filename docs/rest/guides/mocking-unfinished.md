---
title: Mocking unfinished endpoints
---

import HooksPlayground from '@site/src/components/HooksPlayground';

You have agreed to an API schema with a backend engineer who will implement it;
but they are starting to code the same time as you. It would be nice to easily
mock the endpoint and use it in a way such that when the endpoint is done
you won't need to make major changes to your code.

<HooksPlayground>

```typescript title="api/Rating.ts"
import { Entity, createResource } from '@rest-hooks/rest';

export class Rating extends Entity {
  readonly id: string = '';
  readonly rating: number = 4.6;
  readonly author: string = '';
  readonly date: Date = new Date(0);

  pk() {
    return this.id;
  }

  static schema = {
    date: Date,
  };
}

const BaseRatingResource = createResource({
  path: '/ratings/:id',
  schema: Rating,
});

export const RatingResource = {
  ...BaseRatingResource,
  getList: BaseRatingResource.getList.extend({
    dataExpiryLength: 10 * 60 * 1000, // 10 minutes
    fetch() {
      return Promise.resolve(
        ['Morningstar', 'Seekingalpha', 'Morningstar', 'CNBC'].map(author => ({
          id: `${Math.random()}`,
          rating: randomFloatInRange(2, 5).toFixed(1),
          author,
          date: '1990-01-01T00:00:00Z',
        })),
      );
    },
  }),
};
```

```tsx title="Demo.tsx" collapsed
import { RatingResource } from './api/Rating';

function Demo() {
  const ratings = useSuspense(RatingResource.getList);
  return (
    <div>
      {ratings.map(rating => (
        <div key={rating.pk()}>
          {rating.author}:{' '}
          {rating.rating}{' '}
          <time>
            {Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
              rating.date,
            )}
          </time>
        </div>
      ))}
    </div>
  );
}
render(<Demo />);
```

</HooksPlayground>

By mocking the
[RestEndpoint](../api/RestEndpoint.md) we can easily fake the data the server will return. Doing
this allows free use of the strongly typed RatingResource as normal throughout the codebase.

Once the API is implemented you can simply remove the custom fetch (and the entire list()
override if that's all it's doing).

In this example we also set the dataExpiryLength to a longer time so the random values generated
persist longer. This makes for a more realistic demo.
