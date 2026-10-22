---
title: Suporte a navegadores legados
---
import PkgTabs from '@site/src/components/PkgTabs';

O Reactive Data Client foi projetado para funcionar sem configuração adicional com a maioria das ferramentas.

Se você encontrar `Uncaught TypeError: Class constructor Resource cannot be invoked without 'new'`,
isso provavelmente se deve ao suporte ao Internet Explorer em uma configuração personalizada do webpack.
O erro ocorre mesmo em um navegador moderno, desde que o seu target (normalmente definido com [browserslist](https://www.npmjs.com/package/browserslist))
inclua navegadores legados como o Internet Explorer.

Nesse caso, siga as instruções abaixo para garantir a compatibilidade.

### Transpilar pacotes {#transpile-packages}

Adicionar o [webpack-plugin-modern-npm](https://www.npmjs.com/package/webpack-plugin-modern-npm) garante a compatibilidade de todos os pacotes
instalados com navegadores legados.

<PkgTabs pkgs="webpack-plugin-modern-npm" dev />


Em seguida, instale o plugin adicionando-o à configuração do webpack.

```js title="webpack.config.js"
const ModernNpmPlugin = require('webpack-plugin-modern-npm');

module.exports = {
  plugins: [
    new ModernNpmPlugin()
  ]
};
```

### Polyfills {#polyfills}

Use o [CRA polyfill](https://github.com/facebook/create-react-app/tree/master/packages/react-app-polyfill)
ou siga as instruções abaixo.

<PkgTabs pkgs="core-js whatwg-fetch" />


```tsx title="index.tsx"
import 'core-js/stable';
import 'whatwg-fetch';
// place the above line at top
```
