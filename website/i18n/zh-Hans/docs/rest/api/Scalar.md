---
title: Scalar Schema - 依赖视角的 Entity 字段
sidebar_label: Scalar
---

import ScalarDemo from '../shared/\_ScalarDemo.mdx';

# Scalar

`Scalar` 用于描述值取决于 endpoint 参数的 [Entity](./Entity.md) 字段，
例如同一行数据中随投资组合、货币或语言区域而变化的列。

当字段属于某个 Entity，但其值会随请求所选的“视角”（lens）而变化时，请使用 `Scalar`。多个组件可以
同时用不同的视角参数渲染同一个 Entity，并各自得到正确的标量值。

- `lens`: **必填** 从 endpoint 参数中选出视角值。
- `key`: **必填** 为该 scalar 的内部表提供命名空间。
- `entity`: 在 `Entity.schema` 字段之外使用时，
  将该 scalar 绑定到某个 `Entity`。

::::note

`Scalar` 用于数字、字符串、布尔值或由日期派生的值等标量值。
与其他 Entity 的关联关系请使用普通的嵌套 [schema](./schema.md)。

::::

## 用法 {#usage}

在这个示例中，`pct_equity` 和 `shares` 取决于所选的投资组合，而
`name` 和 `price` 是 `Company` Entity 的固定属性。

<ScalarDemo renderCount />

:::react

预览上的徽标会统计 React 渲染次数（点击可重置）。切换到一个
新的投资组合会渲染两次，一次是切换本身，一次是其列数据到达时；而
重新访问已缓存的投资组合只渲染一次。

:::

首次渲染时，`getCompanies` 会获取一次数据，以填充 Company Entity 和
初始的 `Scalar(portfolio)` 单元格。之后每次切换投资组合，都会用新的视角从
现有的 `Collection` Entity 重新反规范化——不发起网络请求——而
`getPortfolioColumns` 只为用户实际访问的投资组合获取依赖视角的
单元格。重新访问已在缓存中的投资组合时，两个 endpoint
都不会再次触发。

这之所以可行，是因为列表被包裹在 [Collection](./Collection.md) 中：
`Array` 没有 `queryKey`，所以 `useSuspense(getCompanies, { portfolio: 'B' })`
会错过 endpoint 缓存并触发重新获取。当 `Collection` Entity 在 store 中时，`Collection.queryKey()`
会返回它的 pk，因此只要 pk 在你希望共享的各种情况下保持稳定，
就会走复用路径。

这里 [`argsKey: () => ({})`](./Collection.md#argsKey) 让所有投资组合都使用
同一个 `pk`，因此一个 Collection Entity 就能服务所有视角。当 endpoint 除视角之外
还有真正的筛选参数时，应把筛选参数保留在 pk 中，只去掉
视角：

```typescript
new Collection([Company], {
  argsKey: ({ portfolio, ...filters }) => filters,
});
```

[`nonFilterArgumentKeys`](./Collection.md#nonFilterArgumentKeys) 是另一回事——
它控制 `push` 或 `assign` 这类变更在匹配现有集合时忽略哪些参数——并且_不会_合并 pk。
它适用于排序或分页参数：结果随参数值不同而不同（pk 各异），但
新建的数据仍应进入每个变体。

`getPortfolioColumns` 也使用了 `Collection`，但通过
`argsKey: ({ portfolio }) => ({ portfolio })` 将 `portfolio` 保留在 pk 中，因为每个投资组合
都有各自不同的列响应。`Scalar.entityPk()` 会从数组项中推导出每个单元格的 Company id
（默认委托给 `Company.pk()`），因此 endpoint
可以使用自然的 REST 结构：

```typescript
[
  { id: '1', pct_equity: 0.5, shares: 10000 },
  { id: '2', pct_equity: 0.2, shares: 4000 },
]
```

### Entity 字段 {#entity-fields}

当依赖视角的值作为 Entity 响应的一部分返回时，
在 `Entity.schema` 字段中使用 `Scalar`。

```typescript
import { Collection, Entity, RestEndpoint, Scalar } from '@data-client/rest';

const PortfolioScalar = new Scalar({
  lens: args => args[0]?.portfolio,
  key: 'portfolio',
});

class Company extends Entity {
  id = '';
  price = 0;
  pct_equity = 0;
  shares = 0;

  static schema = {
    pct_equity: PortfolioScalar,
    shares: PortfolioScalar,
  };
}

const getCompanies = new RestEndpoint({
  path: '/companies',
  searchParams: {} as { portfolio: string },
  schema: new Collection([Company], { argsKey: () => ({}) }),
});
```

一个未绑定的 `Scalar` 实例可以在多个 Entity 类之间共享。
作为 `Entity.schema` 字段使用时，父 Entity 会在规范化过程中
自动推断。

### Values Endpoint {#values-endpoint}

当 endpoint 只返回以 Entity pk 为键的标量列时，请使用 [Values](./Values.md)。
由于这种响应没有外层的 Entity schema，构造 `Scalar` 时
需要传入 `entity`。

```typescript
import { Entity, RestEndpoint, Scalar, Values } from '@data-client/rest';

const CompanyPortfolioScalar = new Scalar({
  lens: args => args[0]?.portfolio,
  key: 'portfolio',
  entity: Company,
});

const getPortfolioColumns = new RestEndpoint({
  path: '/companies/columns',
  searchParams: {} as { portfolio: string },
  schema: new Values(CompanyPortfolioScalar),
});

// Response: { '1': { pct_equity: 0.5, shares: 32342 }, '2': { ... } }
```

只返回列的 endpoint 会写入 `Scalar(portfolio)` 单元格，而不修改
`Company` Entity。已绑定的 `Scalar` 仍可用作 `Entity.schema` 字段；
此时以推断出的父 Entity 为准。

## 选项 {#options}

```typescript
new Scalar({ lens, key, entity? })
```

### lens(args): string | undefined {#lens}

从 endpoint 参数中选出视角值，例如投资组合 ID。

规范化响应时必须存在视角值。在规范化期间返回 `undefined`
会抛出错误，因为标量单元格无法存储在可检索的键下。
在反规范化期间，缺少视角时该字段返回 `undefined`。

返回值会成为所存储单元格键的一部分，也会在 [queryKey](#queryKey)
中用于查找单元格。它必须是不包含 `|` 的字符串——`|` 字符是 cpk 的分隔符
（`entityKey|entityPk|lens`），包含 `|` 的视角会与
具有相同末尾片段的其他视角发生冲突。

### key: string {#key}

该 scalar 类型的唯一名称，用作内部 `Scalar` Entity 表的命名空间。

例如，`key: 'portfolio'` 会把单元格存储在 `Scalar(portfolio)` 中。

### entity?: Entity {#entity}

该 `Scalar` 为之存储单元格的 Entity 类。

当 scalar 用作 `Entity.schema` 上的字段时，它是可选的，因为
父 Entity 可以被推断出来。在 `new Values(PortfolioScalar)` 这类
独立使用的场景中则是必需的。

### entityPk(input, parent, key, args): string | number | undefined {#entityPk}

当 `Scalar` 独立使用时（例如在 `Values`、`[Scalar]` 或 `Collection([Scalar])` 中），
推导所绑定 Entity 的主键。存储在 `Scalar(key)` 下的单元格实际 pk
是复合的 `entityKey|entityPk|lens`——这个
方法只提供其中的 `entityPk` 部分。

默认情况下，`entityPk()`：

- 当外层映射的 `key` 能确定地指向该单元格时，返回它——
  即 `parent[key] === input`，例如在 `Values(Scalar)` 中，映射的
  键就是 Entity 的 pk，而单元格本身可能不包含 pk 字段——否则
- 委托给所绑定 Entity 的静态方法 `Entity.pk(input, parent, key, args)`，因此
  `[Scalar]` 和 `Collection([Scalar])` 数组响应——包括嵌套在
  `{ stock: [Scalar] }` 这类父对象 schema 下的数组，以及
  自定义或复合的 Entity pk——都可以开箱即用。

只有当响应使用了 `Entity.pk()` 不会读取的 id 字段时，
才需要在子类中重写 `entityPk()`：

```typescript
class CompanyIdScalar extends Scalar {
  entityPk(input: any) {
    return input.companyId;
  }
}
```

## 行为 {#behavior}

### 规范化 {#normalize}

规范化 Entity 响应时，`Scalar` 会把字段值存储在一个单独的
单元格中，其键为：

```text
entityKey|entityPk|lensValue
```

Entity 行中保留一个与视角无关的、指向该单元格的引用。这使得同一个
Entity 行可以根据当前的 endpoint 参数指向不同的标量值。

规范化 `Values` 响应时，每个顶层键都被视为 Entity 的 pk，
响应值则作为该 Entity 在当前视角下的标量单元格存储。

### 反规范化 {#denormalize}

反规范化期间，`Scalar` 会从 endpoint 参数中读取当前视角并
查找匹配的单元格。如果不存在匹配的视角或单元格，该字段反规范化为
`undefined`。

由于视角参与了反规范化的记忆化，不同投资组合、
货币或语言区域的视图会各自独立缓存，同时共享同一份基础 Entity
数据。

### queryKey {#queryKey}

`Scalar` 是一种 [Queryable](/rest/api/schema#queryable) schema。当它作为
顶层 endpoint schema 使用时——或传给 [useQuery](/docs/api/useQuery)、
[Controller.get](/docs/api/Controller#get)、[schema.Query](./Query.md) 或任何
其他 Queryable 使用方时——它会报告视角与当前参数匹配的
所有单元格的 cpk：

- 命中时返回复合 pk 数组。
- 当视角为 `undefined`、表不存在或
  没有单元格匹配当前视角时，返回 `undefined`。

常见情况——`Scalar` 作为 `Entity.schema` 字段嵌套使用——永远不会调用到
这个方法。反规范化会经由父 Entity 进行，因此只有当 `Scalar` 本身就是被查询的根 schema 时，
才会用到 `queryKey`。

### 规范化存储 {#normalized-storage}

```typescript
entities['Company']['1'] = {
  id: '1',
  price: 100,
  pct_equity: ['1', 'pct_equity', 'Company'],
  shares: ['1', 'shares', 'Company'],
}

entities['Scalar(portfolio)']['Company|1|portfolioA'] = {
  pct_equity: 0.5,
  shares: 32342,
}

entities['Scalar(portfolio)']['Company|1|portfolioB'] = {
  pct_equity: 0.3,
  shares: 323,
}
```

## 相关内容 {#related}

- [Entity](/rest/api/Entity) — 定义标量字段所依附的基础 Entity
- [Values](./Values.md) — 用于只返回列的 endpoint（以 Entity pk 为键的字典）
- [Union](./Union.md) — 用于多态 Entity 的类似包装模式
- [Queryable](/rest/api/schema#queryable) — Scalar 可用于 [useQuery](/docs/api/useQuery)、[Controller.get](/docs/api/Controller#get) 和 [schema.Query](./Query.md)
