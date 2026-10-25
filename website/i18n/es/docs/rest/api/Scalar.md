---
title: Scalar Schema - Campos de entidad que dependen de una lente
sidebar_label: Scalar
---

import ScalarDemo from '../shared/\_ScalarDemo.mdx';

# Scalar

`Scalar` describe los campos de una [Entity](./Entity.md) cuyos valores dependen de los args del endpoint,
como las columnas específicas de un portafolio, una moneda o una configuración regional en la misma fila.

Usa `Scalar` cuando el campo pertenece a una entidad, pero su valor cambia según una
"lente" seleccionada por la petición. Varios componentes pueden renderizar la misma entidad con
distintos args de lente al mismo tiempo, y cada uno recibe los valores scalar correctos.

- `lens`: **obligatorio** Selecciona el valor de la lente a partir de los args del endpoint.
- `key`: **obligatorio** Define el espacio de nombres de la tabla interna de este scalar.
- `entity`: Vincula el scalar a una `Entity` cuando se usa fuera de un campo de
  `Entity.schema`.

::::note

`Scalar` es para valores escalares como números, strings, booleanos o valores derivados de fechas.
Usa [schemas](./schema.md) anidados normales para las relaciones con otras entidades.

::::

## Uso {#usage}

En este ejemplo, `pct_equity` y `shares` dependen del portafolio seleccionado, mientras que
`name` y `price` son propiedades estables de la entidad `Company`.

<ScalarDemo renderCount />

:::react

La insignia de la vista previa cuenta sus renders de React (haz clic para reiniciarla). Cambiar a un
nuevo portafolio renderiza dos veces: una por el cambio y otra cuando llegan sus columnas, mientras que
volver a visitar un portafolio en caché renderiza una sola vez.

:::

En el primer render, `getCompanies` obtiene los datos una vez para poblar las entidades Company y
las celdas iniciales de `Scalar(portfolio)`. Cada cambio de portafolio posterior vuelve a desnormalizar
a partir de la entidad `Collection` existente con la nueva lente (sin fetch de red), y
`getPortfolioColumns` obtiene solo las celdas que dependen de la lente para los portafolios que el
usuario realmente visita. Si vuelves a visitar un portafolio que ya está en caché, ninguno de los dos endpoints
se dispara de nuevo.

Envolver las listas en [Collection](./Collection.md) es lo que hace que esto funcione:
`Array` no tiene `queryKey`, por lo que `useSuspense(getCompanies, { portfolio: 'B' })`
no encontraría la caché del endpoint y dispararía un nuevo fetch. `Collection.queryKey()`
devuelve su pk cuando la entidad `Collection` está en el store, así que la ruta de reutilización
se activa siempre que la pk sea estable entre los casos que quieres compartir.

Aquí [`argsKey: () => ({})`](./Collection.md#argsKey) fuerza a que todos los portafolios tengan
la misma `pk`, de modo que una sola entidad Collection sirve para todas las lentes. Cuando un endpoint tiene
args de filtro reales junto con la lente, conserva los filtros en la pk y descarta solo
la lente:

```typescript
new Collection([Company], {
  argsKey: ({ portfolio, ...filters }) => filters,
});
```

[`nonFilterArgumentKeys`](./Collection.md#nonFilterArgumentKeys) es un asunto distinto:
controla qué args se ignoran cuando una mutación como `push` o
`assign` coincide con colecciones existentes, y _no_ unifica las pks. Úsalo para
args de ordenación o paginación, donde los resultados difieren según el valor (pks distintas) pero
las creaciones aun así deben llegar a todas las variantes.

`getPortfolioColumns` también usa `Collection`, pero conserva `portfolio` en su pk
con `argsKey: ({ portfolio }) => ({ portfolio })` porque cada portafolio tiene una
respuesta de columnas distinta. `Scalar.entityPk()` deriva el id de Company de cada celda
a partir del elemento del array (delegando por defecto en `Company.pk()`), de modo que el endpoint
puede usar la forma REST natural:

```typescript
[
  { id: '1', pct_equity: 0.5, shares: 10000 },
  { id: '2', pct_equity: 0.2, shares: 4000 },
]
```

### Campos de Entity {#entity-fields}

Usa `Scalar` en un campo de `Entity.schema` cuando los valores que dependen de la lente llegan como parte
de la respuesta de la entidad.

```typescript
import { Collection, Entity, RestEndpoint, Scalar } from '@data-client/rest';

const PortfolioScalar = new Scalar({
  lens: args => args[0]?.portfolio,
  key: 'portfolio',
});

class Company extends Entity {
  id = '';
  price = 0;
  pct_equity = 0;
  shares = 0;

  static schema = {
    pct_equity: PortfolioScalar,
    shares: PortfolioScalar,
  };
}

const getCompanies = new RestEndpoint({
  path: '/companies',
  searchParams: {} as { portfolio: string },
  schema: new Collection([Company], { argsKey: () => ({}) }),
});
```

Una única instancia de `Scalar` sin vincular se puede compartir entre varias clases de entidad.
Cuando se usa como campo de `Entity.schema`, la entidad padre se infiere durante
la normalización.

### Endpoint con Values {#values-endpoint}

Usa [Values](./Values.md) cuando un endpoint devuelve solo las columnas scalar, indexadas por
la pk de la entidad. Como esta respuesta no tiene un schema de entidad que la envuelva, pasa `entity` al
construir el `Scalar`.

```typescript
import { Entity, RestEndpoint, Scalar, Values } from '@data-client/rest';

const CompanyPortfolioScalar = new Scalar({
  lens: args => args[0]?.portfolio,
  key: 'portfolio',
  entity: Company,
});

const getPortfolioColumns = new RestEndpoint({
  path: '/companies/columns',
  searchParams: {} as { portfolio: string },
  schema: new Values(CompanyPortfolioScalar),
});

// Response: { '1': { pct_equity: 0.5, shares: 32342 }, '2': { ... } }
```

Los endpoints de solo columnas escriben celdas `Scalar(portfolio)` sin modificar las
entidades `Company`. Un `Scalar` vinculado aún puede usarse como campo de `Entity.schema`;
allí la entidad padre inferida tiene prioridad.

## Opciones {#options}

```typescript
new Scalar({ lens, key, entity? })
```

### lens(args): string | undefined {#lens}

Selecciona el valor de la lente a partir de los args del endpoint, como el ID de un portafolio.

El valor de la lente debe estar presente al normalizar una respuesta. Devolver `undefined`
durante la normalización lanza un error porque la celda scalar no se puede almacenar bajo una clave
recuperable. Durante la desnormalización, una lente ausente devuelve `undefined` para ese campo.

El valor devuelto pasa a formar parte de la clave de la celda almacenada y también se usa para
buscar la celda durante [queryKey](#queryKey). Debe ser un string que no
contenga `|`: el carácter `|` es el delimitador del cpk
(`entityKey|entityPk|lens`), y una lente que contenga `|` colisionaría con
otras lentes que comparten el mismo segmento final.

### key: string {#key}

Nombre único para este tipo de scalar. Define el espacio de nombres de la tabla interna de entidades `Scalar`.

Por ejemplo, `key: 'portfolio'` almacena las celdas en `Scalar(portfolio)`.

### entity?: Entity {#entity}

Clase de Entity para la que este `Scalar` almacena celdas.

Es opcional cuando el scalar se usa como campo de `Entity.schema`, donde la
entidad padre se infiere. Es obligatorio en usos independientes como
`new Values(PortfolioScalar)`.

### entityPk(input, parent, key, args): string | number | undefined {#entityPk}

Deriva la clave primaria de la Entity vinculada cuando `Scalar` se usa de forma independiente, por ejemplo
dentro de `Values`, `[Scalar]` o `Collection([Scalar])`. La pk real de la celda
almacenada bajo `Scalar(key)` es la compuesta `entityKey|entityPk|lens`; este
método solo aporta la parte `entityPk`.

Por defecto, `entityPk()`:

- devuelve la `key` del mapa circundante cuando esta direcciona la
  celda de forma concluyente (es decir, `parent[key] === input`, como en `Values(Scalar)`, donde la clave
  del mapa es la pk de la entidad y la celda puede no incluir los campos de la pk); y luego
- delega en el estático `Entity.pk(input, parent, key, args)` de la entidad vinculada, de modo que las
  respuestas de array `[Scalar]` y `Collection([Scalar])` (incluidos los arrays
  anidados bajo un schema de objeto padre como `{ stock: [Scalar] }`, y las
  pks de Entity personalizadas o compuestas) funcionen sin configuración adicional.

Sobrescribe `entityPk()` en una subclase solo cuando la respuesta usa un campo de id que
`Entity.pk()` no lee:

```typescript
class CompanyIdScalar extends Scalar {
  entityPk(input: any) {
    return input.companyId;
  }
}
```

## Comportamiento {#behavior}

### Normalización {#normalize}

Al normalizar la respuesta de una entidad, `Scalar` almacena el valor del campo en una
celda aparte, identificada por:

```text
entityKey|entityPk|lensValue
```

La fila de la entidad conserva una referencia a esa celda que es independiente de la lente. Esto permite que una
fila de entidad apunte a distintos valores scalar según los args actuales del endpoint.

Al normalizar una respuesta `Values`, cada clave de nivel superior se trata como la pk de la entidad,
y el valor de la respuesta se almacena como la celda scalar de esa entidad para la lente actual.

### Desnormalización {#denormalize}

Durante la desnormalización, `Scalar` lee la lente actual de los args del endpoint y busca
la celda correspondiente. Si no existe ninguna lente o celda coincidente, el campo se desnormaliza a
`undefined`.

Como la lente participa en la memoización de la desnormalización, las vistas separadas por portafolio,
moneda o configuración regional se almacenan en caché de forma independiente mientras comparten los mismos datos base
de la entidad.

### queryKey {#queryKey}

`Scalar` es un schema [Queryable](/rest/api/schema#queryable). Cuando se usa como
schema de endpoint de nivel superior, o se pasa a [useQuery](/docs/api/useQuery),
[Controller.get](/docs/api/Controller#get), [schema.Query](./Query.md) o a cualquier
otro consumidor de Queryable, informa los cpks de todas las celdas cuya lente coincide con
los args actuales:

- Devuelve un array de pks compuestas si hay coincidencia.
- Devuelve `undefined` cuando la lente es `undefined`, falta la tabla o
  ninguna celda coincide con la lente actual.

El caso más común, `Scalar` anidado como campo de `Entity.schema`, nunca llega a
este método. La desnormalización pasa por la entidad padre, por lo que `queryKey`
solo se consulta cuando `Scalar` es en sí mismo el schema raíz que se consulta.

### Almacenamiento normalizado {#normalized-storage}

```typescript
entities['Company']['1'] = {
  id: '1',
  price: 100,
  pct_equity: ['1', 'pct_equity', 'Company'],
  shares: ['1', 'shares', 'Company'],
}

entities['Scalar(portfolio)']['Company|1|portfolioA'] = {
  pct_equity: 0.5,
  shares: 32342,
}

entities['Scalar(portfolio)']['Company|1|portfolioB'] = {
  pct_equity: 0.3,
  shares: 323,
}
```

## Relacionado {#related}

- [Entity](/rest/api/Entity) — define la entidad base a la que se asocian los campos scalar
- [Values](./Values.md) — se usa para endpoints de solo columnas (diccionario indexado por la pk de la entidad)
- [Union](./Union.md) — patrón de envoltorio similar para entidades polimórficas
- [Queryable](/rest/api/schema#queryable) — Scalar participa en [useQuery](/docs/api/useQuery), [Controller.get](/docs/api/Controller#get) y [schema.Query](./Query.md)
