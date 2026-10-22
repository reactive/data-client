---
title: useController() - Manipulação do store com tipagem segura no React
vue_title: useController() - Manipulação do store com tipagem segura no Vue
sidebar_label: useController()
description: O Controller fornece métodos com tipagem segura para acessar o store e despachar actions para ele.
---

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

import TypeScriptEditor from '@site/src/components/TypeScriptEditor';
import StackBlitz from '@site/src/components/StackBlitz';

# useController()

O [Controller](./Controller.md) fornece métodos com tipagem segura para acessar o store e despachar actions para ele.

Por exemplo [fetch](./Controller.md#fetch), [invalidate](./Controller.md#invalidate)
e [setResponse](./Controller.md#setResponse)

:::react

```tsx
import { useCallback } from 'react';
import { useController } from '@data-client/react';
import { MyResource } from './resources';

function MyComponent({ id }: { id: string }) {
  const ctrl = useController();

  const handleRefresh = useCallback(
    async e => {
      await ctrl.fetch(MyResource.get, { id });
    },
    [ctrl, id],
  );

  const handleSuspend = useCallback(
    async e => {
      await ctrl.invalidate(MyResource.get, { id });
    },
    [ctrl, id],
  );

  const handleLogout = useCallback(
    async e => {
      ctrl.resetEntireStore();
    },
    [ctrl],
  );
}
```

:::

:::vue

```html
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { MyResource } from './resources';

  const props = defineProps<{ id: string }>();
  const ctrl = useController();

  const handleRefresh = async () => {
    await ctrl.fetch(MyResource.get, { id: props.id });
  };

  const handleSuspend = async () => {
    await ctrl.invalidate(MyResource.get, { id: props.id });
  };

  const handleLogout = () => {
    ctrl.resetEntireStore();
  };
</script>
```

`useController()` deve ser chamado dentro de `<script setup>` (ou `setup()`) e exige que o
[DataClientPlugin](./DataClientPlugin.md) esteja instalado.
O mesmo [Controller](./Controller.md) também está disponível nos templates e na Options API como [`$dataClient`](./DataClientPlugin.md#dataclient).

:::

## Exemplos {#examples}

### Envio de formulário {#form-submission}

[fetch](./Controller.md#fetch) retorna a resposta desnormalizada, correspondendo ao tipo de retorno de [useSuspense()](./useSuspense.md). Isso permite usar métodos de Entity como `pk()`.

:::react

```tsx
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useController } from '@data-client/react';
import { PostResource } from './PostResource';

function CreatePost() {
  const ctrl = useController();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const post = await ctrl.fetch(
      PostResource.getList.push,
      new FormData(e.target as HTMLFormElement),
    );
    post.title;
    post.computedField;
    navigate(`/post/${post.pk()}`);
  };

  return <form onSubmit={handleSubmit}>{/* fields */}</form>;
}
```

:::

:::vue

```html title="CreatePost.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { useRouter } from 'vue-router';
  import { PostResource } from './PostResource';

  const ctrl = useController();
  const router = useRouter();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const post = await ctrl.fetch(
      PostResource.getList.push,
      new FormData(e.target as HTMLFormElement),
    );
    post.title;
    post.computedField;
    router.push(`/post/${post.pk()}`);
  };
</script>

<template>
  <form @submit="handleSubmit"><!-- fields --></form>
</template>
```

:::

### Atualização direta de entity {#direct-entity-update}

Use [set](./Controller.md#set) para atualizações imediatas, sem requisições de rede. Oferece suporte a atualizações funcionais para evitar condições de corrida.

:::react

```tsx
import { useController } from '@data-client/react';
import { Article } from './Article';

function VoteButton({ articleId }: { articleId: string }) {
  const ctrl = useController();

  return (
    <button
      onClick={() =>
        ctrl.set(Article, { id: articleId }, article => ({
          ...article,
          votes: article.votes + 1,
        }))
      }
    >
      Vote
    </button>
  );
}
```

:::

:::vue

```html title="VoteButton.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { Article } from './Article';

  const props = defineProps<{ articleId: string }>();
  const ctrl = useController();

  const vote = () =>
    ctrl.set(Article, { id: props.articleId }, article => ({
      ...article,
      votes: article.votes + 1,
    }));
</script>

<template>
  <button @click="vote">Vote</button>
</template>
```

:::

### Invalidar após uma mutação {#invalidate-after-mutation}

Force um novo fetch dos dados relacionados usando [invalidate](./Controller.md#invalidate) ou [expireAll](./Controller.md#expireAll).

:::react

```tsx
import { useController } from '@data-client/react';
import { UserResource } from './UserResource';

function ClearUserCache({ userId }: { userId: string }) {
  const ctrl = useController();

  const handleClear = async () => {
    // invalidate() causes suspense; expireAll() refetches silently
    ctrl.expireAll(UserResource.get);
    ctrl.expireAll(UserResource.getList);
  };

  return <button onClick={handleClear}>Refresh user data</button>;
}
```

:::

:::vue

```html title="ClearUserCache.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { UserResource } from './UserResource';

  const ctrl = useController();

  const handleClear = async () => {
    // invalidate() causes suspense; expireAll() refetches silently
    ctrl.expireAll(UserResource.get);
    ctrl.expireAll(UserResource.getList);
  };
</script>

<template>
  <button @click="handleClear">Refresh user data</button>
</template>
```

:::

:::tip

Para melhor desempenho e consistência, prefira [incluir as atualizações de efeitos colaterais nas respostas das mutações](/rest/guides/side-effects).

:::

### Prefetching {#prefetching}

Use [fetchIfStale](./Controller.md#fetchIfStale) para fazer prefetch sem buscar novamente dados que ainda estão atualizados.

:::react

```tsx
import { Link } from 'react-router';
import { useController } from '@data-client/react';
import { ArticleResource } from './ArticleResource';

function ArticleLink({ id }: { id: string }) {
  const ctrl = useController();

  return (
    <Link
      to={`/article/${id}`}
      onMouseEnter={() => ctrl.fetchIfStale(ArticleResource.get, { id })}
    >
      Read more
    </Link>
  );
}
```

:::

:::vue

```html title="ArticleLink.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { ArticleResource } from './ArticleResource';

  const props = defineProps<{ id: string }>();
  const ctrl = useController();

  const prefetch = () =>
    ctrl.fetchIfStale(ArticleResource.get, { id: props.id });
</script>

<template>
  <RouterLink :to="`/article/${id}`" @mouseenter="prefetch">
    Read more
  </RouterLink>
</template>
```

:::

### Atualizações via websocket {#websocket-updates}

Preencha o cache com dados externos por meio de [set](./Controller.md#set).

:::react

```tsx
import { useEffect } from 'react';
import { useController } from '@data-client/react';
import { EntityMap } from './resources';

function useWebsocket(url: string) {
  const ctrl = useController();

  useEffect(() => {
    const ws = new WebSocket(url);
    ws.onmessage = event => {
      const { entity, args, data } = JSON.parse(event.data);
      ctrl.set(EntityMap[entity], args, data);
    };
    return () => ws.close();
  }, [ctrl, url]);
}
```

:::

:::vue

```ts title="useWebsocket.ts"
import { onMounted, onUnmounted } from 'vue';
import { useController } from '@data-client/vue';
import { EntityMap } from './resources';

export function useWebsocket(url: string) {
  const ctrl = useController();
  let ws: WebSocket;

  onMounted(() => {
    ws = new WebSocket(url);
    ws.onmessage = event => {
      const { entity, args, data } = JSON.parse(event.data);
      ctrl.set(EntityMap[entity], args, data);
    };
  });
  onUnmounted(() => ws?.close());
}
```

:::

:::warning

Em produção, implemente um [Manager para streams de dados](../concepts/managers.md#data-stream) em vez de :react[effects]:vue[lifecycle hooks] no nível do componente. Managers lidam com o ciclo de vida da conexão de forma global e funcionam com SSR.

:::

### Todo App {#todo-app}

:::react

<StackBlitz app="todo-app" file="src/resources/TodoResource.ts,src/pages/Home/TodoListItem.tsx" view="both" />

:::

:::vue

<StackBlitz app="vue-todo-app" file="src/resources/TodoResource.ts,src/components/TodoItem.vue" view="both" />

:::
