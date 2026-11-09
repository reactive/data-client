import { DataProvider } from '@data-client/react';
import { StrictMode, type ReactNode } from 'react';

import { managers } from './managers';

export default function App({ children }: { children: ReactNode }) {
  return (
    <StrictMode>
      <DataProvider managers={managers}>{children}</DataProvider>
    </StrictMode>
  );
}
