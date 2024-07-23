---
'@data-client/react': patch
---

Add configuration to [getDefaultManagers()](https://dataclient.io/docs/api/getDefaultManagers)

```ts
// completely remove DevToolsManager
const managers = getDefaultManagers({ devToolsManager: null });
```

```ts
// easier configuration
const managers = getDefaultManagers({
	devToolsManager: {
	  // double latency to help with high frequency updates
	  latency: 1000,
	  // skip websocket updates as these are too spammy
	  predicate: (state, action) =>
	    action.type !== actionTypes.SET_TYPE || action.schema !== Ticker,
	}
});
```

```ts
// passing instance allows us to use custom classes as well
const managers = getDefaultManagers({
	networkManager: new CustomNetworkManager(),
});
```