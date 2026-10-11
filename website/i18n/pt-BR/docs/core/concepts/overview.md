---
title: Visão geral
unlisted: true
---

import SchemaTable from '../shared/\_schema_table.mdx';
import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Link from '@docusaurus/Link';

## Definição da API {#api-definition}

|                 Nome                 | Definição                                     |
| :----------------------------------: | --------------------------------------------- |
|    [Endpoint](/rest/api/Endpoint)    | Métodos assíncronos                           |
|     [Schema](./normalization.md)     | Modelo de dados declarativo                   |
| [Resource](/rest/api/resource) | Conjunto de métodos para um determinado modelo de dados. |

### Condições do Endpoint {#endpoint-conditions}

<table>
        <thead>
                <tr>
                        <th>Valor</th>
                        <th>Definição</th>
                </tr>
        </thead>
        <tbody>
        		<tr class="grouplabel"><th colSpan="2"><Link to="./expiry-policy">Status de expiração</Link></th></tr>
                <tr>
                        <th>Fresh</th>
                        <td>Os dados sempre podem ser usados e não precisam de atualização.</td>
                </tr>
                <tr>
                        <th>Stale</th>
                        <td>Os dados podem ser exibidos, mas precisam ser atualizados.</td>
                </tr>
                <tr>
                        <th>Invalid</th>
                        <td>Os dados não devem ser exibidos.</td>
                </tr>
        </tbody>
        <tbody>
        		<tr class="grouplabel"><th colSpan="2"><Link to="./error-policy">Política de erros</Link></th></tr>
                <tr>
                        <th>Soft</th>
                        <td>Erros transitórios que não devem invalidar os dados existentes.</td>
                </tr>
                <tr>
                        <th>Hard</th>
                        <td>Sempre invalida o endpoint.</td>
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

### Schema {#schema}

<SchemaTable />

## Cliente {#client}

<ThemedImage
alt="FLUX"
sources={{
    light: useBaseUrl('/img/flux-full.png'),
    dark: useBaseUrl('/img/flux-full-dark.png'),
  }}
/>

|                                  Nome                                  | Definição                                                                          |
| :--------------------------------------------------------------------: | ---------------------------------------------------------------------------------- |
| [Flux](https://facebookarchive.github.io/flux/docs/in-depth-overview/) | Fluxo de dados unidirecional                                                       |
|                                 Store                                  | Local centralizado para armazenar os dados e processá-los                          |
|                        [Manager](./managers.md)                        | Orquestra o fluxo de controle global. Interage com o store por meio de um middleware. |
|                   [Controller](../api/Controller.md)                   | Acesso imperativo ao store, com tipagem segura.                                    |
