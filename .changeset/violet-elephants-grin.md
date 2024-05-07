---
"@data-client/rest": patch
---

Add support for {} to RestEndpoint.path


```ts
  const getThing = new RestEndpoint({
    path: '/:attr1?{-:attr2}?{-:attr3}?',
  });

  getThing({ attr1: 'hi' });
  getThing({ attr2: 'hi' });
  getThing({ attr3: 'hi' });
  getThing({ attr1: 'hi', attr3: 'ho' });
  getThing({ attr2: 'hi', attr3: 'ho' });
  ```