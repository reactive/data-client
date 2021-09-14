---
title: Expiry Policy
sidebar_label: Expiry Policy
---

Stale-while-revalidate

## TTL

## Force refresh

// fetch

## Invalidate (re-suspend)

### A specific endpoint

// invalidate

### Any endpoint with an entity

// deletes

## Error policy

[errorPolicy](../api/Endpoint#errorpolicy)

### Soft

### Hard

### Example

Since `500`s indicate a failure of the server, we want to use stale data
if it exists. On the other hand, something like a `400` indicates 'user error', which
means the error indicates something about application flow - like if a record is deleted, resulting
in `400`. Keeping the record around would be inaccurate.

Since this is the typical behavior for REST APIs, this is the default policy in [@rest-hooks/rest](https://www.npmjs.com/package/@rest-hooks/rest)

```ts
  /** Get the request options for this SimpleResource */
  static getEndpointExtra(): EndpointExtraOptions | undefined {
    return {
      errorPolicy: error =>
        error.status >= 500 ? ('soft' as const) : undefined,
    };
  }
  ```
