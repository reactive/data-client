---
title: Compatibilidad con navegadores antiguos
---
import PkgTabs from '@site/src/components/PkgTabs';

Reactive Data Client está diseñado para funcionar de inmediato con la mayoría de las herramientas.

Si ves `Uncaught TypeError: Class constructor Resource cannot be invoked without 'new'`,
lo más probable es que se deba a que apuntas a la compatibilidad con Internet Explorer mediante una configuración personalizada de webpack.
Esto ocurrirá incluso con un navegador moderno, siempre que tu objetivo (normalmente definido con [browserslist](https://www.npmjs.com/package/browserslist))
incluya navegadores antiguos como Internet Explorer.

En ese caso, sigue las instrucciones de abajo para asegurar la compatibilidad.

### Transpilar paquetes {#transpile-packages}

Agregar [webpack-plugin-modern-npm](https://www.npmjs.com/package/webpack-plugin-modern-npm) garantizará la compatibilidad de todos los
paquetes instalados con navegadores antiguos.

<PkgTabs pkgs="webpack-plugin-modern-npm" dev />


Luego instala el plugin agregándolo a la configuración de webpack.

```js title="webpack.config.js"
const ModernNpmPlugin = require('webpack-plugin-modern-npm');

module.exports = {
  plugins: [
    new ModernNpmPlugin()
  ]
};
```

### Polyfills {#polyfills}

Usa el [polyfill de CRA](https://github.com/facebook/create-react-app/tree/master/packages/react-app-polyfill)
o sigue las instrucciones de abajo.

<PkgTabs pkgs="core-js whatwg-fetch" />


```tsx title="index.tsx"
import 'core-js/stable';
import 'whatwg-fetch';
// place the above line at top
```
