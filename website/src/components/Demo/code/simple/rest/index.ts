import api from '!!raw-loader!./api.ts';
import Demo from '!!raw-loader!./Demo.tsx';

export default {
  label: 'REST',
  value: 'rest',
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
