import { memo, Suspense } from 'react';
import { NetworkErrorBoundary } from 'rest-hooks';
import type { ReactNode } from 'react';
import { Spin } from 'antd';

function Boundary({
  children,
  fallback = <Loading />,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <Suspense fallback={fallback}>
      <NetworkErrorBoundary>{children}</NetworkErrorBoundary>
    </Suspense>
  );
}
export default memo(Boundary);

export const Loading = () => (
  <div className="center">
    <Spin size="large" />
  </div>
);
