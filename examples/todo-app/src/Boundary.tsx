import { memo, Suspense } from 'react';
import { NetworkErrorBoundary } from 'rest-hooks';
import type { ReactNode } from 'react';

function Boundary({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <NetworkErrorBoundary>{children}</NetworkErrorBoundary>
    </Suspense>
  );
}
export default memo(Boundary);
