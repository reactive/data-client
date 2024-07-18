---
'@data-client/core': patch
'@data-client/react': patch
---

fix: Devtools correctly logs fetch actions

We inspect fetches against inflight to see if they are throttled;
However, we previously did this after we sent the action to NetworkManager, which
meant it would also skip logging any throttlable fetches - even if they were not throttled.