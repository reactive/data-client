---
'@data-client/react': patch
---

Don't warn "Uncaught suspense" when React renders a Suspense fallback during SSR without committing it

React 19's streaming server renderer (`renderToReadableStream`, `renderToPipeableStream`) also renders the fallback of a boundary with more than 500 bytes of content, then discards it. `DataProvider`'s backup fallback warned during render, so server rendering logged "Uncaught suspense" even though nothing suspended. It now warns from an effect, like React Native already did, so only a fallback that actually shows in the browser warns.
