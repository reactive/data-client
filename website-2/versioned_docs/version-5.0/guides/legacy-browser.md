---
title: Legacy browser support
---
import PkgTabs from '@site/src/components/PkgTabs';

Rest Hooks is designed to work out of the box with most tooling.

If you see, `Uncaught TypeError: Class constructor Resource cannot be invoked without 'new'`
this is most likely due to targeting Internet Explorer support with a custom webpack configuration.
This will occur even when using a modern browser, so long as your target (typically set with [browserslist](https://www.npmjs.com/package/browserslist))
includes legacy browsers like Internet Explorer.

In this case, follow the instructions below to ensure compatibility.

### Transpile packages

Adding [webpack-plugin-modern-npm](https://www.npmjs.com/package/webpack-plugin-modern-npm) will ensure compatibility of all installed
packages with legacy browsers.

<PkgTabs pkgs="webpack-plugin-modern-npm" dev />


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

<PkgTabs pkgs="core-js whatwg-fetch" />

#### `index.tsx`

```tsx
import 'core-js/stable';
import 'whatwg-fetch';
// place the above line at top
```
