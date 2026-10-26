---
title: 在浏览器中调试
---

通过任何能在页面中运行 JavaScript 的浏览器工具，以编程方式调试 :react[`@data-client/react`]:vue[`@data-client/vue`] 的状态和 action。在开发模式下，应用的 [DevToolsManager](../api/DevToolsManager.md#controllers) 会把 store 放到 `globalThis.__DC__` 上：`__DC__.controller` 是它的 [Controller](../api/Controller.md)，因此所有 Controller 方法都可用；`__DC__.actions` 是它最近的 [action](../api/Actions.md)。

## 前提条件 {#prerequisites}

1. 开发服务器以 `NODE_ENV !== 'production'` 运行
2. 一个能在页面中运行 JavaScript 的浏览器工具，并已加载应用（参见浏览器工具）
3. :react[`DataProvider`]:vue[`DataClientPlugin`] 的 managers 中包含 `DevToolsManager`（开发模式下默认包含）

## 浏览器工具 {#browser-tools}

下面的每个代码片段都是一个函数。在表格中找到你的工具：它会以下面的某种方式运行代码片段，它的
设置页面说明了如何打开页面。

| 工具 | 运行代码片段的方式 | 方法 | 网络日志 | 控制台 | 设置 |
|---|---|---|---|---|---|
| Cursor 桌面 agent | `browser_cdp` | [Awaited expression](#awaited-expression) | [requests 代码片段](#without-a-network-or-console-tool) | [console capture](#without-a-network-or-console-tool) | [browser-cursor](./browser-cursor.md#desktop-agent) |
| Cursor 云端 agent | 启用 Playwright 后的 `browser_evaluate` | [Function](#function) | `browser_network_requests` | `browser_console_messages` | [browser-cursor](./browser-cursor.md#cloud-agent) |
| Chrome DevTools MCP | `evaluate_script` | [Function](#function) | `list_network_requests` | `list_console_messages` | [browser-chrome-devtools-mcp](./browser-chrome-devtools-mcp.md) |
| Playwright MCP | `browser_evaluate` | [Function](#function) | `browser_network_requests` | `browser_console_messages` | [browser-playwright-mcp](./browser-playwright-mcp.md) |
| Claude in Chrome | `javascript_tool` | [Expression](#expression) | `read_network_requests` | `read_console_messages` | [browser-claude-in-chrome](./browser-claude-in-chrome.md) |

任何其他工具只要能在页面中运行 JavaScript 并返回结果就可以使用：选择下面与之匹配的方式
（Playwright 的 `page.evaluate` 是 function；CDP 的 `Runtime.evaluate` 是 awaited expression）。只能
点击、输入和读取控制台的浏览器无法运行这些代码片段；请改为连接上面的某个工具。

### Function {#function}

该工具接受一个函数，在页面中调用它并 await 其结果。请原样传入代码片段。

### Awaited expression {#awaited-expression}

该工具会对一个表达式求值，就像 CDP 的 `Runtime.evaluate`。调用代码片段并让工具 await 它：

- `expression`: `(<snippet>)()`
- `awaitPromise`: `true`
- `returnByValue`: `true`

代码片段的值是 `result.value`。先检查 `exceptionDetails`：抛出的异常或被拒绝的 promise 会出现在那里，
而被拒绝时 `result.value` 仍会返回 `{}`。对于裸函数
（`result.type` 为 `"function"`）、没有 `awaitPromise` 的异步代码片段以及 DOM 节点，返回的也是 `{}`，因此请返回普通数据。

### Expression {#expression}

该工具返回最后一个表达式的值，并且不会 await promise。调用同步代码片段：
`(<snippet>)()`。用下面的代码启动异步代码片段，然后在后续调用中读取 `__DC_RESULT__`，直到它被设置。它
包含 `{ value }`，如果代码片段抛出异常则为 `{ error }`。一次只运行一个异步代码片段。

```js
globalThis.__DC_RESULT__ = undefined; // so an earlier snippet's result can't be read as this one's
(<snippet>)().then(
  value => (globalThis.__DC_RESULT__ = { value }),
  e => (globalThis.__DC_RESULT__ = { error: String(e) }),
);
```

### 没有网络或控制台工具时 {#without-a-network-or-console-tool}

从页面的 `performance` 条目中获取请求的 URL、耗时和状态：

```js
// run in page — requests
() => performance.getEntriesByType('resource').map(e => ({
  url: e.name,
  duration: e.duration,
  status: e.responseStatus,
  transferSize: e.transferSize,
  bodySize: e.decodedBodySize,
}))
```

`transferSize` 为 `0` 而 `bodySize` 不为零，表示浏览器的 HTTP 缓存在没有询问服务器的情况下做出了响应；对于没有 `Timing-Allow-Origin` 的跨域响应，两者都为 `0`，因为它会隐藏大小。对于任何不经 CORS 读取的跨域响应（包括图片和字体，即使它们已加载），`status` 都为 `0`，而且
被拦截的请求可能不会出现，因此请改为在该键的 `meta` 错误中检查失败（[错误](#errors)）。

要读取控制台输出，请在每次页面加载后安装这个 console capture。它会记录之后的控制台调用、
未捕获的错误和未处理的 rejection；用 `__DC_CONSOLE__.slice(-20)` 读取它们。对于页面加载期间的错误，
先安装它，然后重复该操作（[修改状态](#change-state)中的 `invalidateAll`，或应用内导航）。

```js
// run in page — console capture
() => {
  if (globalThis.__DC_CONSOLE__) return { ok: true, count: __DC_CONSOLE__.length };
  const log = (globalThis.__DC_CONSOLE__ = []);
  const text = (a) => {
    if (a instanceof Error) return a.stack ?? String(a);
    if (typeof a === 'string') return a;
    try { return JSON.stringify(a); } catch { return String(a); }
  };
  const push = (level, args) => {
    log.push({ level, time: Date.now(), text: args.map(text).join(' ') });
    if (log.length > 200) log.splice(0, 100);
  };
  for (const level of ['log', 'info', 'warn', 'error', 'debug']) {
    const orig = console[level];
    console[level] = (...args) => { push(level, args); return orig.apply(console, args); };
  }
  addEventListener('error', (e) => push('uncaught', [e.error ?? e.message]));
  addEventListener('unhandledrejection', (e) => push('unhandledrejection', [e.reason]));
  return { ok: true, count: 0 };
}
```

## 从哪里开始 {#where-to-start}

| 症状 | 首先检查 |
|---|---|
| 数据从不出现或一直处于加载中 | 该键的 `meta` 错误（[错误](#errors)）以及网络日志中它的请求 |
| 变更成功了，但 UI 显示旧数据 | 变更键的 `meta` 错误：无法规范化的响应（例如包裹在 `{ data }` 中的响应）会存储在那里，而不是 action 上。然后检查 `state.entities`：如果 entity 没有变化，且响应只位于变更自身的 `endpoints` 键下，说明该 endpoint 没有 `schema`。新建的项没有出现在列表中：将 `state.endpoints` 中列表的键与调用 create 或 `getList.push` 时的参数进行比较；Collection 如何匹配列表，请参阅 skill "data-client-schema" |
| 修改显示后又自行还原 | 变更键的 `meta` 错误：乐观更新会在其请求失败时还原。如果没有错误，请重复该修改，并按时间读取日志（[Action](#actions)），找出之后带有更新的 `meta.fetchedAt`、携带旧值的 `rdc/setresponse`（通常是轮询）；如果它携带的是该 entity 的旧版本，修复应在该 Entity 的定义中进行（skill "data-client-schema"）。如果服务器已经返回新值，说明中间有某一层提供了旧值：浏览器的 HTTP 缓存响应时 `transferSize` 为 `0` 而 `bodySize` 不为零（requests 代码片段） |
| 请求触发得太频繁 | 网络日志中的请求时间，然后是该键的日志（[Action](#actions)）：每次获取之前是否有 `rdc/invalidate` 或 `rdc/invalidateall`（有某个东西，通常是 Manager，在不断使它失效）。`pollFrequency` 的单位是毫秒 |
| 请求从不触发 | 该键的 `meta.expiresAt`：在此之前数据保持新鲜。被轮询的键还需要日志中有 `rdc/subscribe` |

## Store {#the-store}

代码片段使用 entity `Todo` 和包含 `/todos` 的路径：请替换为应用自己的。

- **多个 store**（`__DC__.controller` 抛出 `Set __DC__.store to one of: ...`）：将 `__DC__.store` 设置为
  `__DC__.stores` 中其 `getState().endpoints` 包含你正在调试的键的那个键。页面加载会清除它。
- **`__DC__` 未定义**：页面是生产构建、它的 managers 中没有 `DevToolsManager`，或者它的
  `@data-client` 包早于 0.19。

## 读取状态 {#read-state}

某个键的反规范化响应，与组件看到的一致。action 日志保存了每个已获取键的 endpoint 和 `args`，
因此这适用于自页面加载以来读取过的任何键：

```js
// run in page — response for a key
() => {
  const c = __DC__.controller, state = c.getState();
  // a fetch of the key, not a mutation of an item under it
  const a = __DC__.actions.findLast(
    a => a.args && !a.endpoint?.sideEffect && a.key?.includes('/todos'),
  );
  if (!a) return { error: 'key not in the action log; repeat the fetch' };
  const { data, expiryStatus, expiresAt } = c.getResponse(a.endpoint, ...a.args, state);
  return { key: a.key, data, expiryStatus, expiresAt, error: c.getError(a.endpoint, ...a.args, state)?.message };
}
```

`expiryStatus`：`1` 为 Invalid，`2` 为 InvalidIfStale，`3` 为 Valid。要再次获取它并读取最新的响应：

```js
// run in page — refetch a key
async () => {
  const c = __DC__.controller;
  // skip mutations: fetching their endpoint would send the change again
  const a = __DC__.actions.findLast(
    a => a.args && !a.endpoint?.sideEffect && a.key?.includes('/todos'),
  );
  if (!a) return { error: 'key not in the action log' };
  await c.fetch(a.endpoint, ...a.args);
  return c.getResponse(a.endpoint, ...a.args, c.getState()).data;
}
```

原始的规范化状态，用于已不在日志中的键，或查看 entity 是如何存储的（结构见
[状态结构](#state-shape-reference)）：

```js
// run in page — cache entries by path substring
() => {
  const state = __DC__.controller.getState();
  return Object.keys(state.endpoints).filter(k => k.includes('/todos')).map(key => ({
    key, value: state.endpoints[key], meta: state.meta[key],
  }));
}
```

`getState().entities.Todo` 按 pk 保存了每个 `Todo`。

## Action {#actions}

日志保留最新的 100 个 action，每个轮询键（endpoint 与参数）只保留最后几个。只有最新的
20 个会保留 `response`；要查看 payload，请重复该 action 并立即读取。条目从
前面开始丢弃，因此请按时间（`meta.fetchedAt >= start`）而不是索引来选择。action 包含 endpoint 和 promise，因此请把
它们映射为普通字段：

```js
// run in page — recent actions
() => __DC__.actions.slice(-20).map(a => ({
  type: a.type,
  key: a.key,
  endpoint: a.endpoint?.name,
  args: a.args,
  fetchedAt: a.meta?.fetchedAt,
  error: a.error ? (a.response?.message || true) : undefined,
}))
```

### 错误 {#errors}

存储响应时抛出的错误（例如缺少主键）只会出现在 `meta` 中，action 上没有 `error`，
因此请同时检查两者：

```js
// run in page — errors
() => ({
  actions: __DC__.actions
    .filter(a => a.error)
    .map(a => ({ type: a.type, key: a.key, error: a.response?.message || true })),
  meta: Object.entries(__DC__.controller.getState().meta)
    .filter(([, m]) => m.error)
    .map(([key, m]) => ({ key, error: m.error.message, status: m.error.status })),
})
```

## 修改状态 {#change-state}

使用 Controller 方法，永远不要直接 dispatch：它们记录的 action 与应用自身调用时相同。

```js
// run in page — invalidate keys by path substring
() => {
  __DC__.controller.invalidateAll({ testKey: key => key.includes('/todos') });
  return { invalidated: true };
}
```

`expireAll` 接受相同的 `testKey`，将键标记为过时，在下次使用之前不会重新获取。
对已记录的 action 使用 `setResponse(a.endpoint, ...a.args, value)` 可以注入 mock 数据，`resetEntireStore()`
会清除所有内容。

## 状态结构参考 {#state-shape-reference}

```ts
State = {
  entities: { [entityKey: string]: { [pk: string]: EntityInstance } },
  endpoints: { [cacheKey: string]: PK | PK[] | unknown },
  indexes: { [entityKey: string]: { [indexName: string]: { [lookupValue: string]: PK } } },
  meta: {
    [key: string]: {
      date, fetchedAt, expiresAt,
      prevExpiresAt?, error?, invalidated?, errorPolicy?: 'hard' | 'soft'
    }
  },
  entitiesMeta: { [entityKey: string]: { [pk: string]: { date, expiresAt, fetchedAt } } },
  optimistic: (SetResponseAction | OptimisticAction)[],
  lastReset: number,
}
```
