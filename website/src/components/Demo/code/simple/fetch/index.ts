import api from '!!raw-loader!./api.ts';
import Demo from '!!raw-loader!./Demo.tsx';

export default {
  label: 'Fetch',
  value: 'fetch',
  autoFocus: true,

  code: [
    {
      path: 'api',
      code: api,
    },
    {
      path: 'react',
      open: true,
      code: Demo,
    },
  ],
};
