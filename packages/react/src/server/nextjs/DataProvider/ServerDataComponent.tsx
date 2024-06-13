import { use } from 'react';

import ServerData from '../../ServerData.js';

const id = 'data-client-data';

const ServerDataComponent = ({
  nonce,
  initPromise,
}: {
  nonce?: string | undefined;
  initPromise: Promise<any>;
}) => {
  const data = use(initPromise);
  return <ServerData data={data} id={id} nonce={nonce} />;
};
export default ServerDataComponent;
