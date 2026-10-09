---
title: Visión general
unlisted: true
---

import SchemaTable from '../shared/\_schema_table.mdx';
import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Link from '@docusaurus/Link';

## Definición de la API {#api-definition}

|                 Name                 | Definición                                    |
| :----------------------------------: | --------------------------------------------- |
|    [Endpoint](/rest/api/Endpoint)    | Métodos asíncronos                            |
|     [Schema](./normalization.md)     | Modelo de datos declarativo                   |
| [Resource](/rest/api/resource) | Colección de métodos para un modelo de datos. |

### Condiciones del Endpoint {#endpoint-conditions}

<table>
        <thead>
                <tr>
                        <th>Valor</th>
                        <th>Definición</th>
                </tr>
        </thead>
        <tbody>
        		<tr class="grouplabel"><th colSpan="2"><Link to="./expiry-policy">Estado de caducidad</Link></th></tr>
                <tr>
                        <th>Fresco</th>
                        <td>Los datos siempre pueden usarse y no necesitan actualizarse.</td>
                </tr>
                <tr>
                        <th>Obsoleto</th>
                        <td>Los datos pueden mostrarse, pero hay que actualizarlos.</td>
                </tr>
                <tr>
                        <th>Inválido</th>
                        <td>Los datos no deben mostrarse.</td>
                </tr>
        </tbody>
        <tbody>
        		<tr class="grouplabel"><th colSpan="2"><Link to="./error-policy">Política de errores</Link></th></tr>
                <tr>
                        <th>Suave</th>
                        <td>Errores transitorios que no deben invalidar los datos existentes.</td>
                </tr>
                <tr>
                        <th>Duro</th>
                        <td>Siempre invalidan el endpoint.</td>
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

|                                  Name                                  | Definición                                                                         |
| :--------------------------------------------------------------------: | ---------------------------------------------------------------------------------- |
| [Flux](https://facebookarchive.github.io/flux/docs/in-depth-overview/) | Flujo de datos unidireccional                                                      |
|                                 Store                                  | Lugar centralizado para almacenar datos y procesarlos                              |
|                        [Manager](./managers.md)                        | Orquesta el flujo de control global. Se comunica con el store mediante un middleware. |
|                   [Controller](../api/Controller.md)                   | Acceso imperativo al store con tipado seguro.                                      |
