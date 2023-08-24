---
'@data-client/endpoint': patch
'@data-client/graphql': patch
'@data-client/rest': patch
'@rest-hooks/endpoint': patch
'@rest-hooks/rest': patch
---

Entity.process() now gets an addition argument of 'args' (sent from endpoint)

```ts
class Stream extends Entity {
  username = '';
  title = '';
  game = '';
  currentViewers = 0;
  live = false;

  pk() {
    return this.username;
  }
  static key = 'Stream';

  process(value, parent, key, args) {
    const processed = super.process(value, parent, key, args);
    processed.username = args[0]?.username;
    return processed;
  }
}
```
