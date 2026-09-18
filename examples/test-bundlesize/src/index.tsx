import { AsyncBoundary, DataProvider } from '@data-client/react';
import React from 'react';
import { createRoot } from 'react-dom/client';

import { Doit } from './ui';

export { Doit };
export const second = React.memo(Doit);

export default function Entry() {
  return (
    <DataProvider>
      <AsyncBoundary>
        <Doit />
      </AsyncBoundary>
    </DataProvider>
  );
}
export const renderedElement = <Entry />;

createRoot(document.getElementById('root') || document.body).render(
  renderedElement,
);
