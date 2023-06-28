import AssetPrice from '!!raw-loader!./AssetPrice.tsx';
import resources from '!!raw-loader!./resources.ts';

export default {
  label: 'Polling',
  value: 'polling',
  code: [
    {
      path: 'resources',
      code: resources,
    },
    {
      path: 'AssetPrice',
      open: true,
      code: AssetPrice,
    },
  ],
};
