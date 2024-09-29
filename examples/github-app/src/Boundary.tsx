import { useRouter } from '@anansi/router';
import { AsyncBoundary } from '@data-client/react';
import { styled } from '@linaria/react';
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
  const router = useRouter();

  return (
    <AsyncBoundary fallback={fallback} listen={router.history.listen}>
      {children}
    </AsyncBoundary>
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
