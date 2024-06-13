---
'@data-client/react': patch
---

Add /nextjs entrypoint - eliminating the need for @data-client/ssr package

```tsx
import { DataProvider } from '@data-client/react/nextjs';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <DataProvider>
          {children}
        </DataProvider>
      </body>
    </html>
  );
}
```