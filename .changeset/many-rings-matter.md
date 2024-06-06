---
'@data-client/ssr': patch
---

Add DataProvider export to /nextjs namespace.

This provides 'App Router' compatibility. Simply add it to the root layout, ensuring
`children` is rendered as a descendent.

<details open>
<summary><b>app/layout.tsx</b></summary>

```tsx
import { DataProvider } from '@data-client/react/nextjs';
import { AsyncBoundary } from '@data-client/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <DataProvider>
          <header>Title</header>
          <AsyncBoundary>{children}</AsyncBoundary>
          <footer></footer>
        </DataProvider>
      </body>
    </html>
  );
}
```

</details>
