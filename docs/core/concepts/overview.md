---
title: Overview
unlisted: true
---

import SchemaTable from '../shared/\_schema_table.mdx';
import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Link from '@docusaurus/Link';

## API Definition

|              Name              | Definition                                       |
| :----------------------------: | ------------------------------------------------ |
| [Endpoint](/rest/api/Endpoint) | Async methods                                    |
|  [Schema](./normalization.md)  | Declarative Data model                           |
|   [Entity](/rest/api/Entity)   | A type of schema defining a single unique object |
|            Resource            | Collection of methods for a given data model.    |

## Client

<ThemedImage
alt="FLUX"
sources={{
    light: useBaseUrl('/img/flux.png'),
    dark: useBaseUrl('/img/flux-dark.png'),
  }}
/>

|                Name                | Definition                                                                         |
| :--------------------------------: | ---------------------------------------------------------------------------------- |
|                Flux                | Unidirectional data flow                                                           |
|               Store                | Centralized location for holding data and processing it                            |
|      [Manager](./managers.md)      | Orchestrates global control flow. Interfaces with store by providing a middleware. |
| [Controller](../api/Controller.md) | Type-safe imperative access to store.                                              |

## Endpoint Conditions

<table width="100%">
        <thead>
                <tr>
                        <th>Value</th>
                        <th>Definition</th>
                </tr>
        </thead>
        <tbody>
        		<tr class="grouplabel"><th colspan="2"><Link to="./expiry-policy">Expiry Status</Link></th></tr>
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
        		<tr class="grouplabel"><th colspan="2"><Link to="./error-policy">Error Policy</Link></th></tr>
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
