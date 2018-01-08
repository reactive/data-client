# <RestProvider />

Manages state, providing all context needed to use the hooks. Should be placed as high as possible
in application tree.

`index.tsx`
```tsx
import { RestProvider } from 'rest-hooks';
import ReactDOM from 'react-dom';

ReactDOM.createRoot(document.body).render(
  <RestProvider>
    <App />
  </RestProvider>,
);
```
