import type { State } from '@rest-hooks/core';
import { Suspense } from 'react';

import ServerData from './ServerData.js';

export default function createServerDataComponent(
  useReadyCacheState: () => State<unknown>,
  id = 'rest-hooks-data',
) {
  const ServerDataAsync = ({ nonce }: { nonce?: string | undefined }) => {
    const data = useReadyCacheState();
    return <ServerData data={data} id={id} nonce={nonce} />;
  };
  const ServerDataComponent = ({ nonce }: { nonce?: string | undefined }) => (
    <Suspense>
      <ServerDataAsync nonce={nonce} />
    </Suspense>
  );
  return ServerDataComponent;
}
