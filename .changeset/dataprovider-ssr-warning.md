---
'@data-client/react': patch
---

Fix `DataProvider` warning about SSR on pages that don't fetch during the server render

`DataProvider` used to warn every time it rendered on the server, even when nothing on the page fetched data. Apps that render a static shell and only load data after mount (like Expo Router's static web output) saw the warning on every page. It now warns once, the first time a fetch starts during SSR, since that data will not be rendered. See the [SSR guide](https://dataclient.io/docs/guides/ssr) to render fetched data on the server.
