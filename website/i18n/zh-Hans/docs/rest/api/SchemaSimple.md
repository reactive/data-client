---
title: SchemaSimple - 定义数据处理协议
sidebar_label: SchemaSimple
description: 构建用于规范化、反规范化和查询键的自定义 schema。
---

# SchemaSimple

`SchemaSimple` 是每个 schema 都要实现的接口。你可以自己实现它，
告诉 `@data-client/rest` 如何对内置 schema 无法表达的值进行规范化、反规范化和查询。

大多数应用都用不到它，所以请先查看
[Schema 概览](/rest/api/schema#schema-overview)。只有当你需要内置 schema 所不具备的运行时逻辑时，
才考虑自定义 schema，例如输出依赖于 endpoint 参数，或者需要对较深的 Entity 图进行有限深度的遍历。

## 用法 {#usage}

这个 schema 会存储某个字段的所有翻译，然后只把组件所请求的 `locale`
对应的那一个交给组件：

```typescript
import { Entity, RestEndpoint } from '@data-client/rest';
import type { IDenormalizeDelegate } from '@data-client/rest';

// highlight-next-line
const localeKey = (args: readonly any[]) => args[0]?.locale;

class LocalizedText {
  normalize(input: Record<string, string>) {
    return input;
  }

  denormalize(
    input: Record<string, string>,
    delegate: IDenormalizeDelegate,
  ) {
    // highlight-next-line
    const locale = delegate.argsKey(localeKey) ?? 'en';
    return input[locale] ?? input.en;
  }

  queryKey() {
    return undefined;
  }
}

class Product extends Entity {
  id = '';
  name = '';

  static key = 'Product';
  static schema = {
    name: new LocalizedText(),
  };
}

const getProduct = new RestEndpoint({
  path: '/products/:id',
  searchParams: {} as { locale?: string },
  schema: Product,
});
```

`useSuspense(getProduct, { id: '5', locale: 'fr' })` 会返回一个 `Product`，其
`name` 为法语字符串，而 store 中仍保留所有语言。

`delegate.argsKey()` 告诉缓存输出依赖于 `locale`，因此
切换语言时会重新计算该值。如果直接读取 `delegate.args`，
会得到过时的结果。选择器必须是一个稳定的函数引用，因此
应在模块作用域中定义它，或者在 schema 实例上只定义一次。

## 成员 {#members}

### normalize(input, parent, key, delegate, parentEntity?) {#normalize}

把该位置上的原始响应值转换为存储在
endpoint 结果中的内容。要规范化嵌套的 schema，请调用 [`delegate.visit()`](#inormalizedelegate)，
而不要直接调用它们的方法。

```typescript
normalize(input: any, parent: any, key: string | undefined, delegate: INormalizeDelegate) {
  return {
    ...input,
    data: delegate.visit(this.schema, input.data, input, 'data'),
  };
}
```

对于 `schema` 为 `User` 的包装 schema，
`{ data: { id: '5', name: 'Ada' }, requestId: 'abc' }` 这样的响应会被存储为
`{ data: '5', requestId: 'abc' }`，而 `User` 则存放在 Entity 表中。

`normalize()` 只会对对象输入运行。对于没有 `pk` 的 schema，原始值会原样透传，
除非它设置了 `acceptsPrimitives = true`，因此包裹 Entity 的包装 schema 会按 API 发送的原样存储裸 id。（单独的
[Entity](/rest/api/Entity) 会把真值 id 存储为字符串，所以 `5` 会变成 `'5'`。）同样，`denormalize()` 也永远不会
收到 `null` 或 `undefined`。

`parentEntity` 是最近的外层 Entity schema（即该字段所属的类），如果有的话。
大多数 schema 会忽略它；[Scalar](/rest/api/Scalar) 用它来
找到所绑定的 Entity。

### denormalize(input, delegate) {#denormalize}

接收 `normalize()` 的返回值，并构建由 hook 和
[Controller](/docs/api/Controller) 返回的值。对于嵌套的 schema，请调用
[`delegate.unvisit()`](#idenormalizedelegate)。

```typescript
denormalize(input: any, delegate: IDenormalizeDelegate) {
  return {
    ...input,
    data: delegate.unvisit(this.schema, input.data),
  };
}
```

### queryKey(args, unvisit, delegate) {#queryKey}

构建在不获取数据、直接从 store 读取该 schema 时用于查找的规范化值，
例如使用 [useQuery()](/docs/api/useQuery)、
[Controller.get](/docs/api/Controller#get) 或 [Query](/rest/api/Query) 时。它的结构通常
与 `normalize()` 的返回值一致；`unvisit` 用于向嵌套 schema 获取它
自己的查询键。

```typescript
queryKey(args: readonly any[], unvisit: (schema: any, args: readonly any[]) => any) {
  const data = unvisit(this.schema, args);
  return data === undefined ? undefined : { data };
}
```

当 store 中的数据不足以给出结果时返回 `undefined`；
当已知缓存结果无效时返回 `delegate.INVALID`。

## Delegate {#delegates}

### INormalizeDelegate {#inormalizedelegate}

传给 `normalize()`。

| 成员                                   | 说明                                                                                    |
| -------------------------------------- | --------------------------------------------------------------------------------------- |
| `visit(schema, value, parent, key)`    | 使用嵌套 schema 规范化 `value`                                                          |
| `args`                                 | Endpoint 参数                                                                           |
| `meta`                                 | 响应的 `{ fetchedAt, date, expiresAt }`                                                 |
| `getEntity(key, pk)`                   | 读取一个已存储的 Entity                                                                 |
| `getEntities(key)`                     | 读取某一类型的所有已存储 Entity                                                         |
| `mergeEntity(schema, pk, entity)`      | 通过 Entity 的合并生命周期来存储它                                                      |
| `setEntity(schema, pk, entity, meta?)` | 存储一个 Entity，替换原有内容                                                           |
| `invalidate(schema, pk)`               | 将 Entity 标记为无效，使需要它的组件挂起                                                |
| `checkLoop(key, pk, input)`            | 若该输入在本次调用中已作为 (key, pk) 规范化过，则为 `true`；此时应停止递归              |

从 `getEntity` 到 `invalidate` 这些成员，只有
[类 Entity 的 schema](#entity-like-schemas) 才需要。

### IDenormalizeDelegate {#idenormalizedelegate}

传给 `denormalize()`。

| 成员                     | 说明                                                                              |
| ------------------------ | --------------------------------------------------------------------------------- |
| `unvisit(schema, input)` | 使用嵌套 schema 反规范化 `input`                                                  |
| `argsKey(fn)`            | 返回 `fn(args)`，并在该值变化时重新计算输出                                       |
| `args`                   | Endpoint 参数。不会追踪变化；当输出依赖于参数时请使用 `argsKey()`                 |

### IQueryDelegate {#iquerydelegate}

传给 `queryKey()`。

| 成员                          | 说明                                                     |
| ----------------------------- | -------------------------------------------------------- |
| `getEntity(key, pk)`          | 读取一个已存储的 Entity                                  |
| `getEntities(key)`            | 读取某一类型的所有已存储 Entity                          |
| `getIndex(key, index, value)` | 通过 [Entity 索引](/rest/api/Entity#indexes)查找 pk      |
| `INVALID`                     | 返回它以将结果标记为无效                                 |

## 类 Entity 的 schema {#entity-like-schemas}

任何带有 `pk` 成员的 schema 都会被视为 Entity：它会按 `key` 和 pk 存储并记忆化，
在循环引用中去重，并受
[maxEntityDepth](/rest/api/Entity#maxEntityDepth) 限制。此外它还必须提供
`key`、`createIfValid()` 和 `denormalize()`。与其自己实现这些，
不如直接继承 [Entity](/rest/api/Entity)。

## 示例：限制深度的关联关系 {#example-depth-limited-relationships}

较深的双向图（`Department ↔ Building ↔ Room`）会让反规范化
开销很大。推荐的解决方案是 [Lazy](/rest/api/Lazy)，而
[maxEntityDepth](/rest/api/Entity#maxEntityDepth) 可以限制 Entity 的总嵌套深度；
自定义 schema 则可以针对每个关联关系限制遍历，精确解析 N
层。

`DepthLimited` 最多解析某个关联关系的 `maxDepth` 层，之后改为返回
pk。整个反规范化调用共享同一个 `delegate`，因此以它为键的
`WeakMap` 可以保存每次调用的状态。

```typescript
import { Entity } from '@data-client/rest';
import type {
  IDenormalizeDelegate,
  INormalizeDelegate,
  Schema,
} from '@data-client/rest';

class DepthLimited<S extends Schema> {
  private readonly _state = new WeakMap<
    IDenormalizeDelegate,
    { depth: number }
  >();

  constructor(
    readonly schema: S,
    readonly maxDepth: number,
  ) {}

  normalize(
    input: any,
    parent: any,
    key: any,
    delegate: INormalizeDelegate,
  ) {
    return delegate.visit(this.schema, input, parent, key);
  }

  denormalize(input: {}, delegate: IDenormalizeDelegate) {
    let cell = this._state.get(delegate);
    if (!cell) {
      cell = { depth: 0 };
      this._state.set(delegate, cell);
    }
    cell.depth++;
    try {
      if (cell.depth > this.maxDepth) return input;
      return delegate.unvisit(this.schema, input);
    } finally {
      cell.depth--;
    }
  }

  queryKey(): undefined {
    return undefined;
  }
}

class Department extends Entity {
  id = '';
  name = '';

  static key = 'Department';
  static schema = {
    children: new DepthLimited([Department], 3),
    parent: new DepthLimited(Department, 1),
  };
}
```

反规范化后的 Entity 是按 Entity 记忆化的，而不是按深度。如果某个 Entity 第一次
是在超过 `maxDepth` 的位置被访问到的，它会在该关联关系仍为 pk 的状态下被缓存，
之后从同一个 store 直接读取它时，也会返回这个被截断的形式。

关于可检测循环的变体，以及它与 `Lazy` 之间的取舍，请参阅讨论
[#3828](https://github.com/reactive/data-client/discussions/3828#discussioncomment-16456893)。

## 相关内容 {#related}

- [用 Schema 思考](/rest/api/schema)
- [Entity](/rest/api/Entity)
- [Collection](/rest/api/Collection)
- [Scalar](/rest/api/Scalar)
