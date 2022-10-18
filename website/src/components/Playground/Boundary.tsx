import BrowserOnly from '@docusaurus/BrowserOnly';
import React, { Suspense } from 'react';

export default function Boundary({ fallback, children }) {
  return (
    <BrowserOnly fallback={fallback}>
      {() => <Suspense fallback={fallback}>{children}</Suspense>}
    </BrowserOnly>
  );
}
