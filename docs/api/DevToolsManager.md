---
title: DevToolsManager implements Manager
sidebar_label: DevToolsManager
---

```typescript
class DevToolsManager implements Manager
```

Integrates with [Redux DevTools](https://github.com/zalmoxisus/redux-devtools-extension) to track
state and actions. Note: does not integrate time-travel.

Add the [chrome extension](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)
or [firefox extension](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/) to your
browser to get started.

## constructor(options: Arguments)

[Arguments](https://github.com/zalmoxisus/redux-devtools-extension/blob/master/docs/API/Arguments.md)
to send to redux devtools.

## More info

Using this Manager allows [debugging](../guides/debugging) with redux-devtools.
