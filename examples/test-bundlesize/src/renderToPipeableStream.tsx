import { AsyncBoundary } from '@data-client/react';
import {
  createPersistedStore,
  createServerDataComponent,
} from '@data-client/react/ssr';
import { createRoot } from 'react-dom/client';

import { Doit } from './ui';

const [ServerDataProvider, useReadyCacheState] = createPersistedStore();
const ServerDataComponent = createServerDataComponent(useReadyCacheState);

export default function Entry() {
  return (
    <ServerDataProvider>
      <ServerDataComponent />
      <AsyncBoundary>
        <Doit />
      </AsyncBoundary>
    </ServerDataProvider>
  );
}

createRoot(document.getElementById('root') || document.body).render(<Entry />);
