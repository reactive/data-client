import AssetList from '!!raw-loader!../polling/AssetList.tsx';
import AssetPrice from '!!raw-loader!../polling/AssetPrice.tsx';
import Manager from '!!raw-loader!./Manager.ts';
import resources from '!!raw-loader!./resources.ts';

export default {
  label: 'SSE',
  value: 'sse',
  code: [
    {
      path: 'resources',
      code: resources,
    },
    {
      path: 'Manager',
      open: true,
      code: Manager,
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
