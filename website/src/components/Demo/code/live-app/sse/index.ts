import AssetList from '!!raw-loader!../polling/AssetList.tsx';
import AssetPrice from '!!raw-loader!../polling/AssetPrice.tsx';
import resources from '!!raw-loader!../websocket/resources.ts';
import source from '!!raw-loader!./source.ts';
import StreamManager from '!!raw-loader!./StreamManager.ts';

export default {
  label: 'SSE',
  value: 'sse',
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
      path: 'source',
      ssr: true,
      code: source,
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
