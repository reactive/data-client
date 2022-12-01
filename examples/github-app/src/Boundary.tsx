import { styled } from '@linaria/react';
import { AsyncBoundary } from '@rest-hooks/react';
import { Spin } from 'antd';
import { memo } from 'react';
import type { ReactNode } from 'react';

function Boundary({
  children,
  fallback = <Loading />,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return <AsyncBoundary fallback={fallback}>{children}</AsyncBoundary>;
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
