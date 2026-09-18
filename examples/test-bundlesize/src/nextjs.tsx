import { AsyncBoundary } from '@data-client/react';
import { DataProvider } from '@data-client/react/nextjs';
import { createRoot } from 'react-dom/client';

import { Doit } from './ui';

/** Next.js App Router / RSC adapter graph (`@data-client/react/nextjs`). */
export default function Entry() {
  return (
    <DataProvider>
      <AsyncBoundary>
        <Doit />
      </AsyncBoundary>
    </DataProvider>
  );
}

createRoot(document.getElementById('root') || document.body).render(<Entry />);
