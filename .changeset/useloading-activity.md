---
'@data-client/react': patch
---

Fix `useLoading()` staying `loading` after a call settles in a hidden `<Activity>`

When a [useLoading()](https://dataclient.io/docs/api/useLoading) call finished while its [`<Activity>`](https://react.dev/reference/react/Activity) was hidden, `loading` stayed `true` after it was shown again. Now it shows the call's result.
