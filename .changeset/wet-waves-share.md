---
'@data-client/endpoint': patch
'@data-client/graphql': patch
'@data-client/rest': patch
'@rest-hooks/endpoint': patch
'@rest-hooks/graphql': patch
'@rest-hooks/rest': patch
---

Add nonFilterArgumentKeys argument to Collection

`nonFilterArgumentKeys` defines a test to determine which argument keys
are not used for filtering the results. For instance, if your API uses
'orderBy' to choose a sort - this argument would not influence which
entities are included in the response.

This allows customizing `createCollectionFilter` for the
most common case