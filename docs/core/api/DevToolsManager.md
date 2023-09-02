---
title: DevToolsManager
sidebar_label: DevToolsManager
---

```typescript
class DevToolsManager implements Manager
```

Integrates with [Redux DevTools](https://github.com/reduxjs/redux-devtools) to track
state and actions. Note: does not integrate time-travel.

Add the [chrome extension](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)
or [firefox extension](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/) to your
browser to get started.

:::info implements

`DevToolsManager` implements [Manager](./Manager.md)

:::

## constructor(options?, skipLogging?)

### options

[Arguments](https://github.com/reduxjs/redux-devtools/blob/main/extension/docs/API/Arguments.md)
to send to redux devtools.

### skipLogging

`(action: ActionTypes) => boolean`

Can skip some actions to be registered in the browser devtool.

By default will skip inflight [fetch actions](./Controller.md#fetch)

## More info

Using this Manager allows in browser [debugging and store inspection](../guides/debugging).
