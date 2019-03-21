# \<RestProvider />

Manages state, providing all context needed to use the hooks. Should be placed as high as possible
in application tree as any usage of the hooks is only possible for components below the provider
in the React tree.

`index.tsx`
```tsx
import { RestProvider } from 'rest-hooks';
import ReactDOM from 'react-dom';

ReactDOM.render(
  <RestProvider>
    <App />
  </RestProvider>,
  document.body
);
```
