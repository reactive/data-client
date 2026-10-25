---
title: SchemaSimple - Defina protocolos de processamento de dados
sidebar_label: SchemaSimple
description: Crie schemas personalizados para normalização, desnormalização e query keys.
---

# SchemaSimple

`SchemaSimple` é a interface que todo schema implementa. Implemente-a você mesmo
para ensinar ao `@data-client/rest` como normalizar, desnormalizar e consultar um valor
que os schemas embutidos não conseguem expressar.

A maioria dos apps nunca precisa de um, então consulte primeiro a
[Visão geral de Schemas](/rest/api/schema#schema-overview). Recorra a um schema
personalizado apenas quando precisar de lógica em tempo de execução que os embutidos não têm, como uma saída
que depende dos args do endpoint ou a travessia limitada de grafos profundos de entities.

## Uso {#usage}

Este schema armazena todas as traduções de um campo e entrega aos componentes apenas
a do `locale` que eles pediram:

```typescript
import { Entity, RestEndpoint } from '@data-client/rest';
import type { IDenormalizeDelegate } from '@data-client/rest';

// highlight-next-line
const localeKey = (args: readonly any[]) => args[0]?.locale;

class LocalizedText {
  normalize(input: Record<string, string>) {
    return input;
  }

  denormalize(
    input: Record<string, string>,
    delegate: IDenormalizeDelegate,
  ) {
    // highlight-next-line
    const locale = delegate.argsKey(localeKey) ?? 'en';
    return input[locale] ?? input.en;
  }

  queryKey() {
    return undefined;
  }
}

class Product extends Entity {
  id = '';
  name = '';

  static key = 'Product';
  static schema = {
    name: new LocalizedText(),
  };
}

const getProduct = new RestEndpoint({
  path: '/products/:id',
  searchParams: {} as { locale?: string },
  schema: Product,
});
```

`useSuspense(getProduct, { id: '5', locale: 'fr' })` retorna um `Product` cujo
`name` é a string em francês, enquanto o store mantém todos os locales.

`delegate.argsKey()` informa ao cache que a saída depende de `locale`, então
trocar de locale recalcula o valor. Ler `delegate.args` diretamente
retornaria resultados desatualizados. O seletor deve ser uma referência de função estável, então
defina-o no escopo do módulo ou uma única vez na instância do schema.

## Membros {#members}

### normalize(input, parent, key, delegate, parentEntity?) {#normalize}

Transforma o valor bruto da resposta nesta posição no que é armazenado no
resultado do endpoint. Chame [`delegate.visit()`](#inormalizedelegate) para normalizar
schemas aninhados, em vez de chamar diretamente os métodos deles.

```typescript
normalize(input: any, parent: any, key: string | undefined, delegate: INormalizeDelegate) {
  return {
    ...input,
    data: delegate.visit(this.schema, input.data, input, 'data'),
  };
}
```

Para um wrapper cujo `schema` é `User`, uma resposta
`{ data: { id: '5', name: 'Ada' }, requestId: 'abc' }` é armazenada como
`{ data: '5', requestId: 'abc' }`, com o `User` na tabela de entities.

`normalize()` só é executado para entradas do tipo objeto. Para um schema sem `pk`, primitivos
passam sem alteração, a menos que ele defina `acceptsPrimitives = true`, de modo que um wrapper
em volta de uma entity armazena um id simples exatamente como a API o enviou. (Uma
[Entity](/rest/api/Entity) simples armazena ids truthy como strings, então `5` vira `'5'`.) Da mesma forma, `denormalize()` nunca
recebe `null` ou `undefined`.

`parentEntity` é o schema de entity envolvente mais próximo (a classe à qual este campo
pertence), se houver. A maioria dos schemas o ignora; [Scalar](/rest/api/Scalar) o usa para
encontrar sua vinculação com a entity.

### denormalize(input, delegate) {#denormalize}

Recebe o que `normalize()` retornou e constrói o valor que os hooks e o
[Controller](/docs/api/Controller) retornam. Chame
[`delegate.unvisit()`](#idenormalizedelegate) para schemas aninhados.

```typescript
denormalize(input: any, delegate: IDenormalizeDelegate) {
  return {
    ...input,
    data: delegate.unvisit(this.schema, input.data),
  };
}
```

### queryKey(args, unvisit, delegate) {#queryKey}

Constrói o valor normalizado a ser procurado quando o schema é lido do store
sem fazer fetch, como em [useQuery()](/docs/api/useQuery),
[Controller.get](/docs/api/Controller#get) ou [Query](/rest/api/Query). Normalmente
espelha o formato que `normalize()` retorna; `unvisit` pede a um schema aninhado a sua
própria query key.

```typescript
queryKey(args: readonly any[], unvisit: (schema: any, args: readonly any[]) => any) {
  const data = unvisit(this.schema, args);
  return data === undefined ? undefined : { data };
}
```

Retorne `undefined` quando o store não tiver o suficiente para responder, e
`delegate.INVALID` quando o resultado em cache for sabidamente inválido.

## Delegates {#delegates}

### INormalizeDelegate {#inormalizedelegate}

Passado para `normalize()`.

| Membro                                 | Descrição                                                                             |
| -------------------------------------- | --------------------------------------------------------------------------------------- |
| `visit(schema, value, parent, key)`    | Normaliza `value` com um schema aninhado                                                  |
| `args`                                 | Args do endpoint                                                                        |
| `meta`                                 | `{ fetchedAt, date, expiresAt }` da resposta                                        |
| `getEntity(key, pk)`                   | Lê uma entity armazenada                                                                    |
| `getEntities(key)`                     | Lê todas as entities armazenadas de um tipo                                                      |
| `mergeEntity(schema, pk, entity)`      | Armazena uma entity por meio de seu ciclo de vida de merge                                             |
| `setEntity(schema, pk, entity, meta?)` | Armazena uma entity, substituindo o que havia                                               |
| `invalidate(schema, pk)`               | Marca uma entity como inválida, suspendendo os componentes que dependem dela                              |
| `checkLoop(key, pk, input)`            | `true` quando esta entrada já foi normalizada como (key, pk) nesta chamada; pare a recursão |

`getEntity` até `invalidate` só são necessários para
[schemas semelhantes a entity](#entity-like-schemas).

### IDenormalizeDelegate {#idenormalizedelegate}

Passado para `denormalize()`.

| Membro                   | Descrição                                                                       |
| ------------------------ | --------------------------------------------------------------------------------- |
| `unvisit(schema, input)` | Desnormaliza `input` com um schema aninhado                                          |
| `argsKey(fn)`            | Retorna `fn(args)` e recalcula a saída quando esse valor muda              |
| `args`                   | Args do endpoint. Não rastreia mudanças; use `argsKey()` quando a saída depender deles |

### IQueryDelegate {#iquerydelegate}

Passado para `queryKey()`.

| Membro                        | Descrição                                              |
| ----------------------------- | -------------------------------------------------------- |
| `getEntity(key, pk)`          | Lê uma entity armazenada                                     |
| `getEntities(key)`            | Lê todas as entities armazenadas de um tipo                       |
| `getIndex(key, index, value)` | Encontra uma pk por um [índice de Entity](/rest/api/Entity#indexes) |
| `INVALID`                     | Retorne isto para marcar o resultado como inválido                   |

## Schemas semelhantes a entity {#entity-like-schemas}

Qualquer schema com um membro `pk` é tratado como uma entity: ele é armazenado e memoizado
por `key` e pk, deduplicado entre ciclos e sujeito a
[maxEntityDepth](/rest/api/Entity#maxEntityDepth). Ele deve então fornecer também
`key`, `createIfValid()` e `denormalize()`. Estenda [Entity](/rest/api/Entity)
em vez de construir isso você mesmo.

## Exemplo: relacionamentos com profundidade limitada {#example-depth-limited-relationships}

Grafos bidirecionais profundos (`Department ↔ Building ↔ Room`) tornam a desnormalização
cara. [Lazy](/rest/api/Lazy) é a correção recomendada e
[maxEntityDepth](/rest/api/Entity#maxEntityDepth) limita a profundidade total de aninhamento de entities;
um schema personalizado pode, em vez disso, limitar a travessia por relacionamento, resolvendo exatamente N
níveis.

`DepthLimited` resolve até `maxDepth` níveis de um relacionamento e depois retorna
as pks. Um único `delegate` é compartilhado em toda uma chamada de desnormalização, então um
`WeakMap` indexado por ele guarda o estado por chamada.

```typescript
import { Entity } from '@data-client/rest';
import type {
  IDenormalizeDelegate,
  INormalizeDelegate,
  Schema,
} from '@data-client/rest';

class DepthLimited<S extends Schema> {
  private readonly _state = new WeakMap<
    IDenormalizeDelegate,
    { depth: number }
  >();

  constructor(
    readonly schema: S,
    readonly maxDepth: number,
  ) {}

  normalize(
    input: any,
    parent: any,
    key: any,
    delegate: INormalizeDelegate,
  ) {
    return delegate.visit(this.schema, input, parent, key);
  }

  denormalize(input: {}, delegate: IDenormalizeDelegate) {
    let cell = this._state.get(delegate);
    if (!cell) {
      cell = { depth: 0 };
      this._state.set(delegate, cell);
    }
    cell.depth++;
    try {
      if (cell.depth > this.maxDepth) return input;
      return delegate.unvisit(this.schema, input);
    } finally {
      cell.depth--;
    }
  }

  queryKey(): undefined {
    return undefined;
  }
}

class Department extends Entity {
  id = '';
  name = '';

  static key = 'Department';
  static schema = {
    children: new DepthLimited([Department], 3),
    parent: new DepthLimited(Department, 1),
  };
}
```

As entities desnormalizadas são memoizadas por entity, não por profundidade. Uma entity alcançada
primeiro além de `maxDepth` é armazenada em cache com esse relacionamento deixado como pks, e uma
leitura direta posterior dela no mesmo store retorna essa forma truncada.

Veja a discussão
[#3828](https://github.com/reactive/data-client/discussions/3828#discussioncomment-16456893)
para uma variante que detecta ciclos e os trade-offs em relação a `Lazy`.

## Relacionados {#related}

- [Pensando em Schemas](/rest/api/schema)
- [Entity](/rest/api/Entity)
- [Collection](/rest/api/Collection)
- [Scalar](/rest/api/Scalar)
