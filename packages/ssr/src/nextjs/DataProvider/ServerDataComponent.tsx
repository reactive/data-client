import { use } from 'react';

import { readyContext } from './context.js';
import ServerData from '../../ServerData.js';

const id = 'data-client-data';

const ServerDataComponent = ({ nonce }: { nonce?: string | undefined }) => {
  const data = use(readyContext)();
  return <ServerData data={data} id={id} nonce={nonce} />;
};
export default ServerDataComponent;
