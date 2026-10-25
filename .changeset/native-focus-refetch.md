---
'@data-client/react': patch
---

Fix React Native screens refetching fresh data every time they regain focus

On React Native, [useSuspense()](https://dataclient.io/docs/api/useSuspense), [useFetch()](https://dataclient.io/docs/api/useFetch)
and [useDLE()](https://dataclient.io/docs/api/useDLE) revalidate when a screen comes back into focus. They checked
the expiry from the screen's first render, so once that data went stale, every refocus refetched it, even right after
a fetch had made it fresh. After the arguments changed, they could also refetch the old arguments.

Refocusing now refetches only when the current data is [stale](https://dataclient.io/docs/concepts/expiry-policy#stale)
or [invalid](https://dataclient.io/docs/concepts/expiry-policy#invalid), using the current arguments.
