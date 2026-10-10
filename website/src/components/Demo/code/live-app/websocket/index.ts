import AssetList from '!!raw-loader!../polling/AssetList.tsx';
import AssetPrice from '!!raw-loader!../polling/AssetPrice.tsx';
import socket from '!!raw-loader!./socket.ts';
import resources from '!!raw-loader!./resources.ts';
import StreamManager from '!!raw-loader!./StreamManager.ts';

export default {
  label: 'Websocket',
  value: 'websocket',
  code: [
    {
      path: 'resources',
      code: resources,
    },
    {
      path: 'StreamManager',
      ssr: true,
      code: StreamManager,
    },
    {
      path: 'socket',
      ssr: true,
      code: socket,
    },
    {
      path: 'AssetPrice',
      open: true,
      code: AssetPrice,
    },
    {
      path: 'AssetList',
      code: AssetList,
    },
  ],
};
