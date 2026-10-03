---
'@data-client/react': patch
---

Fix serialized SSR state breaking out of its `<script>` tag

`ServerData` (used by `createServerDataComponent` and the Next.js provider) wrote the store as-is
into a `<script type="application/json">`. An API response containing `</script>` ended the tag
early, corrupting the page and allowing markup injection. `<`, `>`, `&` and the U+2028/U+2029 line
terminators are now escaped; the payload stays valid JSON.
