---
title: Ordenando dados REST no cliente de forma eficiente | Data Client
sidebar_label: Ordenação (no cliente)
---

import SortDemo from '../shared/\_SortDemo.mdx';

# Ordenação no cliente

Aqui temos uma API que ordena com base no campo `orderBy`. Ao envolver nossa [Collection](../api/Collection.md)
em uma [Query](../api/Query.md) que ordena, podemos garantir que a ordem correta seja mantida após [adicionar](../api/RestEndpoint.md#push)
novos posts.

Nosso código de exemplo começa ordenando por `title`. Tente adicionar alguns posts e veja-os serem inseridos na
ordem correta.

<SortDemo defaultTab="PostList" />