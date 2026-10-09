---
title: 模拟尚未完成的 endpoint
---

import HooksPlayground from '@site/src/components/HooksPlayground';

你已经和一位后端工程师商定了 API schema，由他来实现；
但他和你同时开始写代码。如果能轻松地
模拟这个 endpoint，并以这样一种方式使用它，使得 endpoint 完成后
你无需对代码做大的改动，那就再好不过了。

<HooksPlayground>

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

通过模拟
[RestEndpoint](../api/RestEndpoint.md)，我们可以轻松伪造服务器将返回的数据。这样
就可以在整个代码库中照常自由使用强类型的 RatingResource。

API 实现之后，你只需删除自定义的 fetch 即可（如果整个 list()
覆盖只做了这件事，也可以把它整个删掉）。

在这个示例中，我们还把 dataExpiryLength 设置得更长，让生成的随机值
保留得更久。这让演示更加贴近真实。
