---
title: Legacy browser support
---

Rest Hooks is designed to work out of the box with most tooling.

If you see, `Uncaught TypeError: Class constructor Resource cannot be invoked without 'new'`
this is most likely due to targeting Internet Explorer support with a custom webpack configuration.
This will occur even when using a modern browser, so long as your target (typically set with [browserslist](https://www.npmjs.com/package/browserslist))
includes legacy browsers like Internet Explorer.

In this case, follow the instructions below to ensure compatibility.

### Transpile packages

Adding [webpack-plugin-modern-npm](https://www.npmjs.com/package/webpack-plugin-modern-npm) will ensure compatibility of all installed
packages with legacy browsers.

<!--DOCUSAURUS_CODE_TABS-->
<!--yarn-->
```bash
yarn add --dev webpack-plugin-modern-npm
```
<!--npm-->
```bash
npm install webpack-plugin-modern-npm
```
<!--END_DOCUSAURUS_CODE_TABS-->

Then install the plugin by adding to webpack config.

`webpack.config.js`

```js
const ModernNpmPlugin = require('webpack-plugin-modern-npm');

module.exports = {
  plugins: [
    new ModernNpmPlugin()
  ]
};
```

### Polyfills

Use [CRA polyfill](https://github.com/facebook/create-react-app/tree/master/packages/react-app-polyfill)
or follow instructions below.

<!--DOCUSAURUS_CODE_TABS-->
<!--yarn-->
```bash
yarn add core-js whatwg-fetch
```
<!--npm-->
```bash
npm install core-js whatwg-fetch
```
<!--END_DOCUSAURUS_CODE_TABS-->

#### `index.tsx`

```tsx
import 'core-js/stable';
import 'whatwg-fetch';
// place the above line at top
```
