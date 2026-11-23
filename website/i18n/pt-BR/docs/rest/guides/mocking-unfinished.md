---
title: Simulando endpoints inacabados
---

import HooksPlayground from '@site/src/components/HooksPlayground';

Para desenvolver sobre um endpoint que o backend ainda não terminou, simule-o na definição do endpoint. Quando o endpoint estiver
pronto, seus componentes não mudam.

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

A sobrescrita de `fetch` no [RestEndpoint](../api/RestEndpoint.md) retorna dados falsos. O restante do código usa o
`RatingResource` tipado normalmente.

Quando a API estiver pronta, remova toda a sobrescrita de `getList`. Tanto `fetch` quanto `dataExpiryLength` existem apenas para o mock.

`dataExpiryLength: Infinity` impede que os dados [expirem](/docs/concepts/expiry-policy), então o Data Client não os refaz o fetch por conta própria nem substitui os valores aleatórios.