---
title: Immediate Mutation Updates
id: immediate-updates
original_id: immediate-updates
---

When a user causes mutations like creating, updating, or deleting resources, it's important
to have those changed be reflected in the application. A simple publish cache
that has no underlying knowledge of the data structures would require a refetch of any endpoints
that are changed. This would reduce performance and put extra burden on the backend.

However, like many other cases, a normalized cache - one with underlying knowledge of the relationships
between resources - is capable of keeping all data consistent and fresh without
any refetches.

## Update

Rest Hooks uses your schema definitions to understand how to normalize response data into
an `entity table` and `result table`. Of course, this means that there is only ever one copy
of a given `entity`. Aside from providing consistency when using different response shapes,
this means that by providing an accurate schema definition, Rest Hooks can automatically keep
all data uses consistent and fresh. The default update shapes [Resource.updateShape()](../api/resource) and
[Resource.partialUpdate()](../api/resource) both do this automatically. [Read more about defining other
update fetch shapes](./rpc)

## Delete

Rest Hooks automatically deletes entity entries when any [Fetch Shape](../api/FetchShape)
of type `delete` is resolved. [Resource.deleteShape()](../api/resource#deleteshape-deleteshape)
provides such a shape.

## Create

Like updates, created entities are automatically added to the entities table. This means
any components useResource() for just that item will be able to access it immediately and
not have to wait for an additional retrieval request. However, often new items are created
when viewing an entire list of items, and the create should result in that list - any maybe others -
displaying the newly created entry.

In the case list views are expected to include newly created items, a third argument to
the fetch function [updateParams](../api/useFetcher#updateparams-destshape-destparams-updatefunction)
can be added.

See [updateParams](../api/useFetcher#updateparams-destshape-destparams-updatefunction) for more information,
but it essentially specifies which lists to update.
