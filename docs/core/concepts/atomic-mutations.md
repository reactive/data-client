---
title: Atomic Mutations ⚛
sidebar_label: Atomic Mutations
---

<head>
  <title>⚛ Atomic Mutations: Safe, high performance async mutations</title>
  <meta name="docsearch:pagerank" content="10"/>
</head>

# Safety beyond types

When a user causes mutations like creating, updating, or deleting resources, it's important
to have those changed be reflected in the application. A simple publish cache
that has no underlying knowledge of the data structures would require a refetch of any endpoints
that are changed. This would reduce performance and put extra burden on the backend.

However, like many other cases, a normalized cache - one with underlying knowledge of the relationships
between resources - is capable of keeping all data consistent and fresh without
any refetches.

## Update

Reactive Data Client uses your schema definitions to understand how to normalize response data into
an `entity table` and `result table`. Of course, this means that there is only ever one copy
of a given `entity`. Aside from providing consistency when using different response endpoints,
this means that by providing an accurate schema definition, Reactive Data Client can automatically keep
all data uses consistent and fresh. The default update endpoints [Resource.update](/rest/api/createResource#update) and
[Resource.partialUpdate](/rest/api/createResource#partialupdate) both do this automatically. [Read more about defining other
update endpoints](/rest/guides/rpc)

## Delete

Reactive Data Client automatically deletes entity entries [schema.Invalidate](/rest/api/Invalidate) is used.
[Resource.delete](/rest/api/createResource#delete)
provides such an endpoint.

## Create

Created entities are immediately available. They can also be added to existing [Collections](/rest/api/Collection)
with [.push](./RestEndpoint.md#push), [.unshift](./RestEndpoint.md#unshift), or [.assign](./RestEndpoint.md#assign).