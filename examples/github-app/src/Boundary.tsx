import { memo, Suspense } from 'react';
import { NetworkErrorBoundary } from 'rest-hooks';
import type { ReactNode } from 'react';
import { Spin } from 'antd';
import { styled } from '@linaria/react';

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
  <Center>
    <Spin size="large" />
  </Center>
);

const Center = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: auto;
`;
