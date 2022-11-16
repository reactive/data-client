import { NetworkErrorBoundary } from '@rest-hooks/react';
import { memo, Suspense } from 'react';
import type { ReactNode } from 'react';

function Boundary({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <NetworkErrorBoundary>{children}</NetworkErrorBoundary>
    </Suspense>
  );
}
export default memo(Boundary);
