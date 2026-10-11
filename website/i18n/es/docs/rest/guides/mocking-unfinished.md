---
title: Simular endpoints sin terminar
---

import HooksPlayground from '@site/src/components/HooksPlayground';

Has acordado un esquema de API con un ingeniero de backend que lo implementará;
pero empieza a programar al mismo tiempo que tú. Sería ideal poder simular
el endpoint fácilmente y usarlo de tal forma que, cuando el endpoint esté listo,
no tengas que hacer cambios importantes en tu código.

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

Al simular el
[RestEndpoint](../api/RestEndpoint.md) podemos falsear fácilmente los datos que devolverá el servidor. Esto
permite usar con total libertad el RatingResource, con tipado fuerte, de forma normal en todo el código.

Una vez implementada la API, puedes simplemente eliminar el fetch personalizado (y toda la sobrescritura
de list() si eso es lo único que hace).

En este ejemplo también establecemos dataExpiryLength a un tiempo mayor para que los valores aleatorios generados
persistan más. Esto hace que la demostración sea más realista.
