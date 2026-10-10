---
title: 概览
unlisted: true
---

import SchemaTable from '../shared/\_schema_table.mdx';
import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Link from '@docusaurus/Link';

## API 定义 {#api-definition}

|                 名称                 | 定义                                    |
| :----------------------------------: | --------------------------------------------- |
|    [Endpoint](/rest/api/Endpoint)    | 异步方法                                 |
|     [Schema](./normalization.md)     | 声明式数据模型                        |
| [Resource](/rest/api/resource) | 针对某个数据模型的一组方法。 |

### Endpoint 状态 {#endpoint-conditions}

<table>
        <thead>
                <tr>
                        <th>值</th>
                        <th>定义</th>
                </tr>
        </thead>
        <tbody>
        		<tr class="grouplabel"><th colSpan="2"><Link to="./expiry-policy">过期状态</Link></th></tr>
                <tr>
                        <th>新鲜</th>
                        <td>数据始终可用，无需更新。</td>
                </tr>
                <tr>
                        <th>过时</th>
                        <td>数据可以展示，但需要更新。</td>
                </tr>
                <tr>
                        <th>无效</th>
                        <td>数据不应展示。</td>
                </tr>
        </tbody>
        <tbody>
        		<tr class="grouplabel"><th colSpan="2"><Link to="./error-policy">错误策略</Link></th></tr>
                <tr>
                        <th>软</th>
                        <td>不应使现有数据失效的暂时性错误。</td>
                </tr>
                <tr>
                        <th>硬</th>
                        <td>总是使 endpoint 失效。</td>
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

## 客户端 {#client}

<ThemedImage
alt="FLUX"
sources={{
    light: useBaseUrl('/img/flux-full.png'),
    dark: useBaseUrl('/img/flux-full-dark.png'),
  }}
/>

|                                  名称                                  | 定义                                                                         |
| :--------------------------------------------------------------------: | ---------------------------------------------------------------------------------- |
| [Flux](https://facebookarchive.github.io/flux/docs/in-depth-overview/) | 单向数据流                                                           |
|                                 Store                                  | 集中存放并处理数据的位置                            |
|                        [Manager](./managers.md)                        | 编排全局控制流。通过提供中间件与 store 交互。 |
|                   [Controller](../api/Controller.md)                   | 以类型安全的命令式方式访问 store。                                              |
