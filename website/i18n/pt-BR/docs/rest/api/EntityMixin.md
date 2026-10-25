---
title: EntityMixin - Objetos únicos declarativos para classes pré-existentes
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

`Entity` define um único objeto _único_.

Se você já tem classes para os seus tipos de dados, o `EntityMixin` pode ser para você.

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

## Opções {#options}

O segundo argumento do mixin pode ser usado para personalizar a construção de forma conveniente. Se não for especificado, os membros estáticos
da classe `Base` serão usados. Alternativamente, assim como com [Entity](./Entity.md), você sempre pode especificá-los
como membros estáticos da classe final.

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

### pk: string | (value, parent?, key?, args?) => string | number | undefined, padrão 'id' {#pk}

Especifica o [Entity.pk](./Entity.md#pk)

Uma `string` indica o campo a ser usado como pk.

Uma `function` é usada exatamente como [Entity.pk](./Entity.md#pk), mas o primeiro argumento (`value`) é `this`

O padrão é 'id'; o que significa que pk é uma opção obrigatória _a menos que_ a classe `Base` tenha um membro `id` serializável.

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

Especifica o [Entity.key](./Entity.md#key)

### schema: \{[k\:string]: Schema} {#schema}

Especifica o [Entity.schema](./Entity.md#schema)


## const vs class {#const-vs-class}

Se você não precisa personalizar mais a entity, pode usar uma declaração `const` em vez de
estender outra classe com `extend`.

Há uma diferença sutil ao se referir ao `class token` em TypeScript: declarações
`class` se referem ao tipo da instância, enquanto `const tokens` se referem ao valor, então você
precisa usar `typeof`; além disso, typeof fornece o tipo da classe, então é preciso aplicar `InstanceType`
por cima.

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

Para sobrescrever métodos de ciclo de vida como [process()](#process), você deve usar a forma `class ... extends EntityMixin(...) {}`.
As opções de `EntityMixin()` incluem apenas [pk](#pk), [key](#key) e [schema](#schema); as sobrescritas de ciclo de vida ficam na própria classe.

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
