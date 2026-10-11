---
title: Simulando endpoints inacabados
---

import HooksPlayground from '@site/src/components/HooksPlayground';

Você combinou um schema de API com uma pessoa engenheira de backend que vai implementá-lo,
mas ela está começando a codificar ao mesmo tempo que você. Seria bom simular o endpoint
com facilidade e usá-lo de um jeito que, quando o endpoint ficar pronto,
você não precise fazer grandes mudanças no seu código.

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

Ao simular o
[RestEndpoint](../api/RestEndpoint.md), podemos fingir com facilidade os dados que o servidor retornará. Isso
permite usar o RatingResource, com tipagem forte, normalmente em toda a base de código.

Quando a API estiver implementada, basta remover o fetch personalizado (e toda a sobrescrita de list()
caso seja só isso que ela faz).

Neste exemplo também definimos o dataExpiryLength com um tempo maior, para que os valores aleatórios gerados
persistam por mais tempo. Isso torna a demo mais realista.