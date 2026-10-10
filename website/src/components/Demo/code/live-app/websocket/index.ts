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
      path: 'socket',
      code: socket,
    },
    {
      path: 'StreamManager',
      open: true,
      code: StreamManager,
    },
    {
      path: 'AssetPrice',
      code: AssetPrice,
    },
    {
      path: 'AssetList',
      code: AssetList,
    },
  ],
};
