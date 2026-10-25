---
title: Endpoint - Definiciones de API con tipado fuerte
sidebar_label: Endpoint
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import HooksPlayground from '@site/src/components/HooksPlayground';

# Endpoint

`Endpoint` sirve para cualquier función asíncrona (una que devuelve una Promise).

Los `Endpoints` definen una interfaz estándar con tipado fuerte de metadatos y ciclos de vida relevantes
útiles para Reactive Data Client y otros stores.

Paquete: [@data-client/endpoint](https://www.npmjs.com/package/@data-client/endpoint)

:::tip

Endpoint es una clase independiente del protocolo. Prueba mejor con los patrones específicos de cada protocolo:
[REST](./RestEndpoint.md), [GraphQL](/graphql/api/GQLEndpoint)
o [getImage](/docs/guides/img-media#just-images).

:::

<details>
<summary><b>Interfaz</b></summary>

<Tabs
defaultValue="Interface"
values={[
{ label: 'Interface', value: 'Interface' },
{ label: 'Class', value: 'Class' },
{ label: 'EndpointExtraOptions', value: 'EndpointExtraOptions' },
]}>
<TabItem value="Interface">

```typescript
export interface EndpointInterface<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
> extends EndpointExtraOptions<F> {
  (...args: Parameters<F>): InferReturn<F, S>;
  key(...args: Parameters<F>): string;
  readonly sideEffect?: M;
  readonly schema?: S;
}
```

</TabItem>
<TabItem value="Class">

```typescript
class Endpoint<F extends (...args: any) => Promise<any>>
  implements EndpointInterface
{
  constructor(fetchFunction: F, options: EndpointOptions);

  key(...args: Parameters<F>): string;

  readonly sideEffect?: true;

  readonly schema?: Schema;

  fetch: F;

  extend(options: EndpointOptions): Endpoint;
}

export interface EndpointOptions extends EndpointExtraOptions {
  key?: (params: any) => string;
  sideEffect?: true | undefined;
  schema?: Schema;
}
```

</TabItem>
<TabItem value="EndpointExtraOptions">

```typescript
export interface EndpointExtraOptions<F extends FetchFunction = FetchFunction> {
  /** Default data expiry length, will fall back to NetworkManager default if not defined */
  readonly dataExpiryLength?: number;
  /** Default error expiry length, will fall back to NetworkManager default if not defined */
  readonly errorExpiryLength?: number;
  /** Poll with at least this frequency in milliseconds */
  readonly pollFrequency?: number;
  /** Marks cached resources as invalid if they are stale */
  readonly invalidIfStale?: boolean;
  /** Enables optimistic updates for this request - uses return value as assumed network response */
  readonly getOptimisticResponse?: (
    snap: SnapshotInterface,
    ...args: Parameters<F>
  ) => ResolveType<F>;
  /** Determines whether to throw or fallback to */
  readonly errorPolicy?: (error: any) => 'soft' | undefined;
  /** User-land extra data to send */
  readonly extra?: any;
}
```

</TabItem>
</Tabs>

</details>

## Uso {#usage}

`Endpoint` hace que las funciones asíncronas existentes se puedan usar en cualquier contexto de Reactive Data Client con verificación completa de TypeScript.

<HooksPlayground defaultOpen="n">

```ts title="interface" collapsed
export interface Todo {
  id: number;
  userId: number;
  title: string;
  completed: boolean;
}
```

```ts title="api" {12}
import { Endpoint } from '@data-client/rest';
import { Todo } from './interface';

const getTodoOriginal = (id: number): Promise<Todo> =>
  Promise.resolve({
    id,
    title: 'delectus aut autem ' + id,
    completed: false,
    userId: 1,
  });

export const getTodo = new Endpoint(getTodoOriginal);
```

```tsx title="React"
import { useSuspense } from '@data-client/react';
import { getTodo } from './api';

function TodoDetail() {
  const todo = useSuspense(getTodo, 1);
  return <div>{todo.title}</div>;
}
render(<TodoDetail />);
```

</HooksPlayground>

### Compartir configuración {#configuration-sharing}

Usa [Endpoint.extend()](#extend) en lugar de `{...getTodo}` (spread)

```ts
const getTodoNormalized = getTodo.extend({ schema: Todo });
const getTodoUpdatingEveryFiveSeconds = getTodo.extend({ pollFrequency: 5000 });
```

## Ciclo de vida {#lifecycle}

### Éxito {#success}

import SuccessLifecycle from '../diagrams/\_endpoint_success_lifecycle.mdx';

<SuccessLifecycle/>

### Error {#error}

import ErrorLifecycle from '../diagrams/\_endpoint_error_lifecycle.mdx';

<ErrorLifecycle/>

## Miembros de Endpoint {#endpoint-members}

Los miembros funcionan también como opciones (segundo argumento del constructor). Aunque ninguno es obligatorio, los primeros
tienen valores por defecto.

### key: (params) => string {#key}

Serializa los parámetros. Se usa para construir una clave de búsqueda en stores globales.

Por defecto:

```typescript
`${this.name} ${JSON.stringify(params)}`;
```

:::warning[Sobrescrituras]

Al sobrescribir `key`, asegúrate de incluir también un [testKey](#testKey) actualizado si
piensas usar ese método.

:::

### testKey(key): boolean {#testKey}

Devuelve `true` si la [key](#key) (de fetch) proporcionada coincide con este endpoint.

Se usa para los interceptors de mock con [&lt;MockResolver /&gt;](/docs/api/MockResolver)

### name: string {#name}

Se usa en [key](#key) para distinguir endpoints. Debe ser único a nivel global.

Por defecto es `this.fetch.name`

:::warning

Esto puede fallar en compilaciones de producción que cambian los nombres de las funciones.
Esto suele conocerse como [function name mangling](https://terser.org/docs/api-reference#mangle-options).

En esos casos puedes sobrescribir `name` o deshabilitar el mangling de funciones.

:::

### sideEffect: boolean {#sideeffect}

Se usa para indicar que el endpoint podría tener efectos secundarios (no idempotente). Esto impide que se use
con [useSuspense()](/docs/api/useSuspense) o [useFetch()](/docs/api/useFetch), ya que estos pueden llamar al
endpoint un número impredecible de veces.

### schema: Schema {#schema}

Definición declarativa de cómo [procesar las respuestas](./schema)

- [dónde](./schema) esperar [Entities](./Entity.md)
- Funciones para [deserializar campos](/rest/guides/network-transform#deserializing-fields)

No proporcionar esta opción significa que no se extraerá ninguna entidad.

```tsx
import { Endpoint, Entity } from '@data-client/endpoint';

class User extends Entity {
  id = '';
  username = '';
}

const getUser = new Endpoint(
    ({ id }) => fetch(`/users/${id}`),
    { schema: User }
);
```

import EndpointLifecycle from './_EndpointLifecycle.mdx';

<EndpointLifecycle />

### extend(options): Endpoint {#extend}

Se puede usar para personalizar aún más la definición del endpoint

```typescript
const getUser = new Endpoint(({ id }) => fetch(`/users/${id}`));


const getUserNormalized = getUser.extend({ schema: User });
```

Además de los miembros, se puede enviar `fetch` para sobrescribir la función fetch.

## Ejemplos {#examples}

<Tabs
defaultValue="Basic"
values={[
{ label: 'Basic', value: 'Basic' },
{ label: 'With Schema', value: 'With Schema' },
{ label: 'List', value: 'List' },
]}>
<TabItem value="Basic">

```typescript
import { Endpoint } from '@data-client/endpoint';

const UserDetail = new Endpoint(
  ({ id }) => fetch(`/users/${id}`).then(res => res.json())
);
```

</TabItem>
<TabItem value="With Schema">

```typescript
import { Endpoint, Entity } from '@data-client/endpoint';

class User extends Entity {
  id = '';
  username = '';
}

const UserDetail = new Endpoint(
  ({ id }) => fetch(`/users/${id}`).then(res => res.json()),
  { schema: User }
);
```

</TabItem>
<TabItem value="List">

```typescript
import { Endpoint, Entity } from '@data-client/endpoint';

class User extends Entity {
  id = '';
  username = '';
}

const UserList = new Endpoint(
  () => fetch(`/users/`).then(res => res.json()),
  { schema: [User] }
);
```

</TabItem>
</Tabs>

<Tabs
defaultValue="React"
values={[
{ label: 'React', value: 'React' },
{ label: 'JS/Node Schema', value: 'JS/Node' },
]}>
<TabItem value="React">

```tsx
import { useSuspense, useController } from '@data-client/react';
import { UserDetail } from './api/User';
import UserForm from './UserForm';

function UserProfile({ id }: { id: string }) {
  const user = useSuspense(UserDetail, { id });
  const ctrl = useController();

  return <UserForm user={user} onSubmit={() => ctrl.fetch(UserDetail)} />;
}
```

</TabItem>
<TabItem value="JS/Node">

```typescript
const user = await UserDetail({ id: '5' });
console.log(user);
```

</TabItem>
</Tabs>

### Adicional {#additional}

- [Paginación](../guides/pagination.md)
- [Simular endpoints sin terminar](../guides/mocking-unfinished.md)
- [Actualizaciones optimistas](../guides/optimistic-updates.md)

## Motivación {#motivation}

Hay una distinción entre

- Qué es una API de red
  - Cómo hacer una petición, qué campos se esperan en la respuesta, etc.
- Cómo se usa
  - Enlazar datos, sondeo (polling), disparar un fetch imperativo, etc.

Por lo tanto, separar claramente las responsabilidades de estos
dos conceptos tiene muchos beneficios.

Con los `TypeScript Standard Endpoints` definimos un estándar para declarar en
TypeScript la definición de una API de red.

- Permite a los autores de APIs publicar paquetes npm con las interfaces de su API
- Las definiciones las puede consumir cualquier librería compatible, lo que facilita su uso en librerías como Vue, React o Angular
- Escribir pipelines de generación de código se vuelve mucho más fácil, ya que la salida es mínima
- Los desarrolladores de producto pueden usar las definiciones en multitud de contextos donde los comportamientos varían
- Los desarrolladores de producto pueden compartir código fácilmente entre plataformas con necesidades de comportamiento distintas, como React Native y React Web

### Qué hay en un Endpoint {#whats-in-an-endpoint}

- Una función que resuelve los resultados
- Una función para almacenar esos resultados de forma única
- Opcional: información sobre cómo almacenar los datos en una caché normalizada
- Opcional: si la petición podría tener efectos secundarios, para evitar llamadas repetidas
