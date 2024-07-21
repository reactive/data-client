---
title: Overview
unlisted: true
---

import SchemaTable from '../shared/\_schema_table.mdx';
import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Link from '@docusaurus/Link';

## API Definition

|                 Name                 | Definition                                    |
| :----------------------------------: | --------------------------------------------- |
|    [Endpoint](/rest/api/Endpoint)    | Async methods                                 |
|     [Schema](./normalization.md)     | Declarative Data model                        |
| [Resource](/rest/api/resource) | Collection of methods for a given data model. |

### Endpoint Conditions

<table>
        <thead>
                <tr>
                        <th>Value</th>
                        <th>Definition</th>
                </tr>
        </thead>
        <tbody>
        		<tr class="grouplabel"><th colSpan="2"><Link to="./expiry-policy">Expiry Status</Link></th></tr>
                <tr>
                        <th>Fresh</th>
                        <td>Data can always be used and needs no updates.</td>
                </tr>
                <tr>
                        <th>Stale</th>
                        <td>Data can be shown, but needs to be updated.</td>
                </tr>
                <tr>
                        <th>Invalid</th>
                        <td>Data should not be shown.</td>
                </tr>
        </tbody>
        <tbody>
        		<tr class="grouplabel"><th colSpan="2"><Link to="./error-policy">Error Policy</Link></th></tr>
                <tr>
                        <th>Soft</th>
                        <td>Transient errors that should not invalidate existing data.</td>
                </tr>
                <tr>
                        <th>Hard</th>
                        <td>Always invalidate endpoint.</td>
                </tr>
        </tbody>
</table>

<!-- #### Endpoint Options

|         Name          | Definition                                                               |
| :-------------------: | ------------------------------------------------------------------------ |
|        schema         | Declarative Data model                                                   |
|      sideEffect       | `false` means it is safe to run more than once without consequence.      |
|   dataExpiryLength    | Lifetime when successful.                                                |
|   errorExpiryLength   | Lifetime in case of failure.                                             |
|      errorPolicy      | Uses `error` to determine [expiryPolicy](./expiry-policy.md).            |
|    invalidIfStale     | `Stale` cache should always be considered `Invalid`.                     |
|     pollFrequency     | Miliseconds before refetch when Endpoint is subscribed.                  |
| getOptimisticResponse | Enables immediate mutation updates, without waiting on async resolution. | -->

### Schema

<SchemaTable />

## Client

<ThemedImage
alt="FLUX"
sources={{
    light: useBaseUrl('/img/flux-full.png'),
    dark: useBaseUrl('/img/flux-full-dark.png'),
  }}
/>

|                                  Name                                  | Definition                                                                         |
| :--------------------------------------------------------------------: | ---------------------------------------------------------------------------------- |
| [Flux](https://facebookarchive.github.io/flux/docs/in-depth-overview/) | Unidirectional data flow                                                           |
|                                 Store                                  | Centralized location for holding data and processing it                            |
|                        [Manager](./managers.md)                        | Orchestrates global control flow. Interfaces with store by providing a middleware. |
|                   [Controller](../api/Controller.md)                   | Type-safe imperative access to store.                                              |
