---
'@data-client/test': patch
---

Fix `act` and `renderHook` typed as `any` on TypeScript 4.0–4.4

`act()`, `renderHook()` and `RenderHookOptions` from `@data-client/test` were `any` on TypeScript 4.0–4.4, and
reported `Cannot find module './renderHook.cjs'` with `skipLibCheck` off. They now have their real types:

```ts
import { act, renderHook } from '@data-client/test';

const { result } = renderHook(() => 5);
result.current; // number
await act(() => Promise.resolve(5)); // number
```
