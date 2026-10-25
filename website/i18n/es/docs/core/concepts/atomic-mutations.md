---
title: '⚛ Mutaciones atómicas: mutaciones asíncronas seguras y de alto rendimiento'
sidebar_label: Mutaciones atómicas
---

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

# Seguridad más allá de los tipos

Cuando un usuario provoca mutaciones como crear, actualizar o eliminar recursos, es importante
que esos cambios se reflejen en la aplicación. Una caché simple de publicación
que no tenga conocimiento de las estructuras de datos subyacentes requeriría volver a obtener cualquier endpoint
afectado por los cambios. Esto reduciría el rendimiento y pondría una carga extra sobre el backend.

Sin embargo, como en muchos otros casos, una caché normalizada (una con conocimiento subyacente de las relaciones
entre recursos) es capaz de mantener todos los datos consistentes y actualizados sin
necesidad de volver a obtener nada.

## Actualizar {#update}

Reactive Data Client usa las definiciones de tu schema para saber cómo normalizar los datos de respuesta en
una `entity table` y una `result table`. Por supuesto, esto significa que solo existe una copia
de una `entity` dada. Además de ofrecer consistencia al usar distintos endpoints de respuesta,
esto significa que, al proporcionar una definición de schema precisa, Reactive Data Client puede mantener automáticamente
todos los usos de los datos consistentes y actualizados. Los endpoints de actualización por defecto [Resource.update](/rest/api/resource#update) y
[Resource.partialUpdate](/rest/api/resource#partialupdate) hacen esto automáticamente. [Lee más sobre cómo definir otros
endpoints de actualización](/rest/guides/side-effects)

## Eliminar {#delete}

Reactive Data Client elimina automáticamente las entradas de entidades cuando se usa [schema.Invalidate](/rest/api/Invalidate).
[Resource.delete](/rest/api/resource#delete)
proporciona un endpoint de ese tipo.

## Crear {#create}

Las entidades creadas están disponibles de inmediato. También se pueden agregar a [Collections](/rest/api/Collection) existentes
con [.push](/rest/api/RestEndpoint#push), [.unshift](/rest/api/RestEndpoint#unshift) o [.assign](/rest/api/RestEndpoint#assign).
