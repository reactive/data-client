---
title: 旧版浏览器支持
---
import PkgTabs from '@site/src/components/PkgTabs';

Reactive Data Client 的设计目标是开箱即用地适配大多数工具链。

如果你看到 `Uncaught TypeError: Class constructor Resource cannot be invoked without 'new'`，
这很可能是因为自定义的 webpack 配置以支持 Internet Explorer 为目标。
即使使用的是现代浏览器也会出现这种情况，只要你的目标（通常通过 [browserslist](https://www.npmjs.com/package/browserslist) 设置）
包含了 Internet Explorer 之类的旧版浏览器。

这种情况下，请按照下面的说明确保兼容性。

### 转译依赖包 {#transpile-packages}

添加 [webpack-plugin-modern-npm](https://www.npmjs.com/package/webpack-plugin-modern-npm) 可以确保所有已安装的
依赖包都与旧版浏览器兼容。

<PkgTabs pkgs="webpack-plugin-modern-npm" dev />


然后在 webpack 配置中添加该插件。

```js title="webpack.config.js"
const ModernNpmPlugin = require('webpack-plugin-modern-npm');

module.exports = {
  plugins: [
    new ModernNpmPlugin()
  ]
};
```

### Polyfills {#polyfills}

使用 [CRA polyfill](https://github.com/facebook/create-react-app/tree/master/packages/react-app-polyfill)
或按照下面的说明操作。

<PkgTabs pkgs="core-js whatwg-fetch" />


```tsx title="index.tsx"
import 'core-js/stable';
import 'whatwg-fetch';
// place the above line at top
```
