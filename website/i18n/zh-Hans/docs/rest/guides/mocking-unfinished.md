---
title: 模拟尚未完成的 endpoint
---

import HooksPlayground from '@site/src/components/HooksPlayground';

要基于后端尚未完成的 endpoint 进行开发，请在 endpoint 定义中模拟它。当 endpoint
就绪时，你的组件无需改动。

<HooksPlayground row>

```typescript title="resources/Rating"
import { Entity, resource } from '@data-client/rest';
import { Temporal } from 'temporal-polyfill';

export class Rating extends Entity {
  id = '';
  rating = 4.6;
  author = '';
  date = Temporal.Instant.fromEpochMilliseconds(0);

  static key = 'Rating';

  static schema = {
    date: Temporal.Instant.from,
  };
}

export const RatingResource = resource({
  path: '/ratings/:id',
  schema: Rating,
}).extend({
  getList: {
    dataExpiryLength: Infinity,
    fetch() {
      return Promise.resolve(
        ['Morningstar', 'Seekingalpha', 'Morningstar', 'CNBC'].map(author => ({
          id: `${Math.random()}`,
          rating: (2 + Math.random() * 3).toFixed(1),
          author,
          date: '1990-01-01T00:00:00Z',
        })),
      );
    },
  },
});
```

```tsx title="Demo" collapsed
import { useSuspense } from '@data-client/react';
import { RatingResource } from './resources/Rating';

function Demo() {
  const ratings = useSuspense(RatingResource.getList);
  return (
    <div>
      {ratings.map(rating => (
        <div key={rating.pk()}>
          {rating.author}: {rating.rating}{' '}
          <time>
            {rating.date.toLocaleString('en-US', { dateStyle: 'medium' })}
          </time>
        </div>
      ))}
    </div>
  );
}
render(<Demo />);
```

</HooksPlayground>

[RestEndpoint](../api/RestEndpoint.md) 上的 `fetch` 覆盖会返回假数据。其余代码照常使用
带类型的 `RatingResource`。

API 就绪后，删除整个 `getList` 覆盖即可。`fetch` 和 `dataExpiryLength` 都只是为了模拟而存在。

`dataExpiryLength: Infinity` 会阻止数据[过期](/docs/concepts/expiry-policy)，因此 Data Client 不会自行重新获取数据并替换掉这些随机值。
