---
title: Union Schema - 面向 React 的声明式多态数据
vue_title: Union Schema - 面向 Vue 的声明式多态数据
sidebar_label: Union
---

import PolymorphicFeedDemo from '../shared/\_PolymorphicFeedDemo.mdx';
import StackBlitz from '@site/src/components/StackBlitz';

# Union

描述一个由多个 schema 联合而成的 schema。当你需要 [schema.Array](./Array.md) 或 [Values](./Values.md) 提供的多态行为，但用于非集合字段时，它会很有用。

- `definition`: **必填** 一个对象，映射输入数组中嵌套 Entity 的定义
- `schemaAttribute`: **必填** 每个 Entity 上的属性，它根据定义映射决定规范化时使用哪个 schema。
  可以是字符串或函数。如果是函数，它接收以下参数：
  - `value`: 该 Entity 的输入值。
  - `parent`: 输入数组的父对象。
  - `key`: 输入数组在父对象上所在的键。

#### 实例方法 {#instance-methods}

- `define(definition)`: 调用时，传入的 `definition` 会与传给 `Union` 构造函数的原始定义合并。这个方法通常用于在 schema 中创建循环引用。

:::info[命名]

`Union` 得名于[集合论中的概念](https://en.wikipedia.org/wiki/Union_(set_theory))，就像 [TypeScript 联合类型](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)

:::

## 用法 {#usage}

:::note

如果你的数据返回了一个没有提供映射的对象，结果中会返回原始对象，且不会创建 Entity。

:::

<PolymorphicFeedDemo schema="Union" attribute="string" />

### 函数形式的 schemaAttribute {#function-schemaattribute}

当判别值无法直接匹配 schema 的键时，使用函数来计算应使用哪个 schema。

<PolymorphicFeedDemo schema="Union" attribute="function" />

:::react

### Github Events {#github-events}

贡献动态来自按类型对 github 事件的分组。每种 Event 都有
各自独立的 schema，这就是我们使用 `Union` 的原因

<StackBlitz app="github-app" file="src/pages/ProfileDetail/UserEvents.tsx,src/resources/Event.tsx" view="preview" initialpath="/users/ntucker" height="700" />

:::
