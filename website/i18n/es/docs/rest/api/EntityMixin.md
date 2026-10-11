---
title: EntityMixin - Objetos únicos declarativos para clases preexistentes
sidebar_label: EntityMixin
---

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

import HooksPlayground from '@site/src/components/HooksPlayground';
import LanguageTabs from '@site/src/components/LanguageTabs';
import { RestEndpoint } from '@data-client/rest';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';

# EntityMixin

`Entity` define un único objeto _único_.

Si ya tienes clases para tus tipos de datos, `EntityMixin` puede ser para ti.

<TypeScriptEditor>

```typescript {10}
import { EntityMixin } from '@data-client/rest';

export class Article {
  id = '';
  title = '';
  content = '';
  tags: string[] = [];
}

export class ArticleEntity extends EntityMixin(Article) {}
```

</TypeScriptEditor>

## Opciones {#options}

El segundo argumento del mixin sirve para personalizar cómodamente la construcción. Si no se especifica, se usarán los
miembros estáticos de la clase `Base`. Alternativamente, igual que con [Entity](./Entity.md), siempre puedes especificarlos
como miembros estáticos de la clase final.

<TypeScriptEditor>

```typescript
class User {
  username = '';
  createdAt = Temporal.Instant.fromEpochMilliseconds(0);
}
class UserEntity extends EntityMixin(User, {
  pk: 'username',
  key: 'User',
  schema: { createdAt: Temporal.Instant.from },
}) {}
```

</TypeScriptEditor>

### pk: string | (value, parent?, key?, args?) => string | number | undefined = 'id' {#pk}

Especifica el [Entity.pk](./Entity.md#pk)

Un `string` indica el campo que se usará como pk.

Una `function` se usa igual que [Entity.pk](./Entity.md#pk), pero el primer argumento (`value`) es `this`

Por defecto es 'id'; lo que significa que pk es una opción obligatoria _a menos que_ la clase `Base` tenga un miembro `id` serializable.

<TypeScriptEditor>

```typescript title="multi-column primary key"
class Thread {
  forum = '';
  slug = '';
  content = '';
}
class ThreadEntity extends EntityMixin(Thread, {
  pk(value) {
    return [value.forum, value.slug].join(',');
  },
}) {}
```

</TypeScriptEditor>

### key: string {#key}

Especifica el [Entity.key](./Entity.md#key)

### schema: \{[k\:string]: Schema} {#schema}

Especifica el [Entity.schema](./Entity.md#schema)


## const vs class {#const-vs-class}

Si no necesitas personalizar más la entidad, puedes usar una declaración `const` en lugar
de `extend` a otra clase.

Hay una diferencia sutil al referirse al `class token` en TypeScript: las
declaraciones `class` se refieren al tipo de la instancia; mientras que los `const tokens` se refieren al valor, por lo que
debes usar `typeof`, pero además typeof da el tipo de la clase, así que debes aplicar `InstanceType`
encima.

<TypeScriptEditor>

```typescript
import { schema } from '@data-client/rest';

export class Article {
  id = '';
  title = '';
  content = '';
  tags: string[] = [];
}

export class ArticleEntity extends EntityMixin(Article) {}
export const ArticleEntity2 = EntityMixin(Article);

const article: ArticleEntity = ArticleEntity.fromJS();
const articleFails: ArticleEntity2 = ArticleEntity2.fromJS();
const articleWorks: InstanceType<typeof ArticleEntity2> =
  ArticleEntity2.fromJS();
```

</TypeScriptEditor>


## Ciclo de vida {#lifecycle}

import Lifecycle from '../diagrams/\_entity_lifecycle.mdx';

<Lifecycle/>

Para sobrescribir métodos del ciclo de vida como [process()](#process), debes usar la forma `class ... extends EntityMixin(...) {}`.
Las opciones de `EntityMixin()` solo incluyen [pk](#pk), [key](#key) y [schema](#schema); las sobrescrituras del ciclo de vida van en la propia clase.

<TypeScriptEditor>

```typescript
import { EntityMixin } from '@data-client/rest';

export class Article {
  id = '';
  title = '';
  content = '';
  tags: string[] = [];
}

// ❌ Not supported (lifecycle methods are not EntityMixin options)
// export const ArticleEntity = EntityMixin(Article, {
//   process(input) {
//     return input;
//   },
// });

// ✅ Use a class when adding lifecycle methods
export class ArticleEntity extends EntityMixin(Article) {
  static process(input: any, parent: any, key: string | undefined, args: any[]) {
    const processed = super.process(input, parent, key, args);
    processed.tags ??= [];
    return processed;
  }
}
```

</TypeScriptEditor>

import LifecycleMethods from '../shared/\_entity_lifecycle_methods.mdx';

<LifecycleMethods entitySyntax="EntityMixin" />
