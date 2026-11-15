---
title: Simular endpoints sin terminar
---

import HooksPlayground from '@site/src/components/HooksPlayground';

Para desarrollar contra un endpoint que el backend aún no ha terminado, simúlalo en la definición del endpoint. Cuando el endpoint esté
listo, tus componentes no cambian.

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

La sobrescritura de `fetch` en el [RestEndpoint](../api/RestEndpoint.md) devuelve datos falsos. El resto del código usa el
`RatingResource` tipado como de costumbre.

Cuando la API esté lista, elimina toda la sobrescritura de `getList`. Tanto `fetch` como `dataExpiryLength` existen solo para el mock.

`dataExpiryLength: Infinity` evita que los datos [caduquen](/docs/concepts/expiry-policy), de modo que Data Client no los vuelve a obtener por su cuenta ni reemplaza los valores aleatorios.
