---
title: Ordenar datos REST del lado del cliente de forma eficiente | Data Client
sidebar_label: Ordenación (lado del cliente)
---

import SortDemo from '../shared/\_SortDemo.mdx';

# Ordenación del lado del cliente

Aquí tenemos una API que ordena según el campo `orderBy`. Al envolver nuestra [Collection](../api/Collection.md)
en una [Query](../api/Query.md) que ordena, podemos asegurar que se mantenga el orden correcto después de [agregar](../api/RestEndpoint.md#push)
nuevas publicaciones.

Nuestro código de ejemplo comienza ordenando por `title`. Prueba agregar algunas publicaciones y observa cómo se insertan en el
orden correcto.

<SortDemo defaultTab="PostList" />
