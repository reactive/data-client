import { translate } from '@docusaurus/Translate';

import type { AutoRunScript } from '../../../Playground/preview/autorun/script';

/** Renames the user, then shows the one User every post reads */
const autoRun: AutoRunScript = [
  {
    caption: translate({
      id: 'homepage.demo.mutations.autoRun.type',
      message: 'Edit the name…',
    }),
    delay: 1000,
    type: { label: 'Name' },
    text: ' Jr.',
  },
  {
    caption: translate({
      id: 'homepage.demo.mutations.autoRun.everywhere',
      message: '…and every post by them updates with it',
    }),
    delay: 300,
    wait: 2200,
  },
  {
    caption: translate({
      id: 'homepage.demo.mutations.autoRun.store',
      message: 'They all read this one User in the Store',
    }),
    store: 'open',
  },
  {
    delay: 1200,
    click: {
      in: 'store',
      selector: '[data-table="User"] tbody tr[data-id]',
    },
  },
  { wait: 3000 },
];
export default autoRun;
