---
'@data-client/react': patch
---

Fix SSR state breaking out of its `<script>` tag when API data contains markup

`ServerData`, `createServerDataComponent()` and the Next.js `DataProvider` wrote the store into the page as-is.
A response containing `</script>` ended the state script early, so the rest of that text became page markup:
the page could not hydrate, and text from an API could add elements to it.

The store is now escaped before it is written. The script still holds valid JSON, so
`getInitialData()` and `awaitInitialData()` read it as before.
