---
title: SchemaSimple - Define protocolos de procesamiento de datos
sidebar_label: SchemaSimple
description: Crea schemas personalizados para la normalización, la desnormalización y las claves de consulta.
---

# SchemaSimple

`SchemaSimple` es la interfaz que implementa todo schema. Impleméntala tú mismo
para enseñarle a `@data-client/rest` cómo normalizar, desnormalizar y consultar un valor
que los schemas integrados no pueden expresar.

La mayoría de las aplicaciones nunca necesita uno, así que revisa primero el
[resumen de Schema](/rest/api/schema#schema-overview). Recurre a un schema
personalizado solo cuando necesites lógica en tiempo de ejecución que los integrados no tienen, como una salida
que depende de los args del endpoint, o un recorrido acotado de grafos de entities profundos.

## Uso {#usage}

Este schema almacena todas las traducciones de un campo y luego entrega a los componentes solo la
del `locale` que solicitaron:

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

`useSuspense(getProduct, { id: '5', locale: 'fr' })` devuelve un `Product` cuyo
`name` es el string en francés, mientras que el store conserva todos los locales.

`delegate.argsKey()` le indica a la caché que la salida depende de `locale`, por lo que
cambiar de locale recalcula el valor. Leer `delegate.args` directamente
devolvería resultados obsoletos. El selector debe ser una referencia de función estable, así que
defínelo en el ámbito del módulo o una sola vez en la instancia del schema.

## Miembros {#members}

### normalize(input, parent, key, delegate, parentEntity?) {#normalize}

Convierte el valor sin procesar de la respuesta en esta posición en lo que se almacena en el
resultado del endpoint. Llama a [`delegate.visit()`](#inormalizedelegate) para normalizar
schemas anidados, en lugar de llamar directamente a sus métodos.

```typescript
normalize(input: any, parent: any, key: string | undefined, delegate: INormalizeDelegate) {
  return {
    ...input,
    data: delegate.visit(this.schema, input.data, input, 'data'),
  };
}
```

Para un wrapper cuyo `schema` es `User`, una respuesta
`{ data: { id: '5', name: 'Ada' }, requestId: 'abc' }` se almacena como
`{ data: '5', requestId: 'abc' }`, con el `User` en la tabla de entities.

`normalize()` solo se ejecuta con entradas de tipo objeto. En un schema sin `pk`, los primitivos
pasan sin cambios a menos que establezca `acceptsPrimitives = true`, de modo que un wrapper
alrededor de una entity almacena un id simple exactamente como lo envió la API. (Una
[Entity](/rest/api/Entity) simple almacena los ids verdaderos como strings, así que `5` se convierte en `'5'`.) Del mismo modo, `denormalize()` nunca
recibe `null` ni `undefined`.

`parentEntity` es el schema de entity envolvente más cercano (la clase a la que pertenece
este campo), si existe. La mayoría de los schemas lo ignoran; [Scalar](/rest/api/Scalar) lo usa para
encontrar su vinculación con la entity.

### denormalize(input, delegate) {#denormalize}

Recibe lo que devolvió `normalize()` y construye el valor que devuelven los hooks y
[Controller](/docs/api/Controller). Llama a
[`delegate.unvisit()`](#idenormalizedelegate) para los schemas anidados.

```typescript
denormalize(input: any, delegate: IDenormalizeDelegate) {
  return {
    ...input,
    data: delegate.unvisit(this.schema, input.data),
  };
}
```

### queryKey(args, unvisit, delegate) {#queryKey}

Construye el valor normalizado que se busca cuando el schema se lee del store
sin hacer fetch, como con [useQuery()](/docs/api/useQuery),
[Controller.get](/docs/api/Controller#get) o [Query](/rest/api/Query). Normalmente
refleja la forma que devuelve `normalize()`; `unvisit` le pide a un schema anidado su
propia clave de consulta.

```typescript
queryKey(args: readonly any[], unvisit: (schema: any, args: readonly any[]) => any) {
  const data = unvisit(this.schema, args);
  return data === undefined ? undefined : { data };
}
```

Devuelve `undefined` cuando el store no tiene suficiente información para responder, y
`delegate.INVALID` cuando se sabe que el resultado en caché es inválido.

## Delegates {#delegates}

### INormalizeDelegate {#inormalizedelegate}

Se pasa a `normalize()`.

| Miembro                                | Descripción                                                                             |
| -------------------------------------- | --------------------------------------------------------------------------------------- |
| `visit(schema, value, parent, key)`    | Normaliza `value` con un schema anidado                                                 |
| `args`                                 | Args del endpoint                                                                       |
| `meta`                                 | `{ fetchedAt, date, expiresAt }` de la respuesta                                        |
| `getEntity(key, pk)`                   | Lee una entity almacenada                                                               |
| `getEntities(key)`                     | Lee todas las entities almacenadas de un tipo                                           |
| `mergeEntity(schema, pk, entity)`      | Almacena una entity a través de su ciclo de vida de combinación (merge)                 |
| `setEntity(schema, pk, entity, meta?)` | Almacena una entity, reemplazando lo que había                                          |
| `invalidate(schema, pk)`               | Marca una entity como inválida, suspendiendo los componentes que la necesitan           |
| `checkLoop(key, pk, input)`            | `true` cuando esta entrada ya se normalizó como (key, pk) en esta llamada; detén la recursión |

`getEntity` hasta `invalidate` solo los necesitan los
[schemas similares a entities](#entity-like-schemas).

### IDenormalizeDelegate {#idenormalizedelegate}

Se pasa a `denormalize()`.

| Miembro                  | Descripción                                                                       |
| ------------------------ | --------------------------------------------------------------------------------- |
| `unvisit(schema, input)` | Desnormaliza `input` con un schema anidado                                        |
| `argsKey(fn)`            | Devuelve `fn(args)` y recalcula la salida cuando ese valor cambia                 |
| `args`                   | Args del endpoint. No rastrea cambios; usa `argsKey()` cuando la salida dependa de ellos |

### IQueryDelegate {#iquerydelegate}

Se pasa a `queryKey()`.

| Miembro                       | Descripción                                              |
| ----------------------------- | -------------------------------------------------------- |
| `getEntity(key, pk)`          | Read a stored entity                                     |
| `getEntities(key)`            | Lee todas las entities almacenadas de un tipo                     |
| `getIndex(key, index, value)` | Encuentra una pk mediante un [índice de Entity](/rest/api/Entity#indexes) |
| `INVALID`                     | Devuélvelo para marcar el resultado como inválido        |

## Schemas similares a entities {#entity-like-schemas}

Todo schema con un miembro `pk` se trata como una entity: se almacena y memoiza
por `key` y pk, se deduplica entre ciclos y está sujeto a
[maxEntityDepth](/rest/api/Entity#maxEntityDepth). Entonces también debe proporcionar
`key`, `createIfValid()` y `denormalize()`. Extiende [Entity](/rest/api/Entity)
en lugar de construir esto tú mismo.

## Ejemplo: relaciones con profundidad limitada {#example-depth-limited-relationships}

Los grafos bidireccionales profundos (`Department ↔ Building ↔ Room`) hacen que la desnormalización
sea costosa. [Lazy](/rest/api/Lazy) es la solución recomendada y
[maxEntityDepth](/rest/api/Entity#maxEntityDepth) limita la profundidad total de anidamiento de entities;
un schema personalizado puede, en cambio, limitar el recorrido por relación, resolviendo exactamente N
niveles.

`DepthLimited` resuelve hasta `maxDepth` niveles de una relación y luego devuelve
las pks. Un mismo `delegate` se comparte durante toda una llamada de desnormalización, así que un
`WeakMap` con él como clave guarda el estado de cada llamada.

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

Las entities desnormalizadas se memoizan por entity, no por profundidad. Una entity a la que se llega por primera vez
más allá de `maxDepth` se guarda en caché con esa relación como pks, y una
lectura directa posterior de ella desde el mismo store devuelve esa forma truncada.

Consulta la discusión
[#3828](https://github.com/reactive/data-client/discussions/3828#discussioncomment-16456893)
para una variante que detecta ciclos y las ventajas y desventajas frente a `Lazy`.

## Relacionado {#related}

- [Pensar en Schemas](/rest/api/schema)
- [Entity](/rest/api/Entity)
- [Collection](/rest/api/Collection)
- [Scalar](/rest/api/Scalar)
