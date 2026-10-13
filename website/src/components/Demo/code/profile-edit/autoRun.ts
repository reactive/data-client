import type { AutoRunScript } from '../../../Playground/preview/autorun/script';

/** Renames the user, lets every byline follow, then opens the one User
 * every post reads */
const autoRun: AutoRunScript = [
  { delay: 1000, type: { label: 'Name' }, text: ' Jr.' },
  { wait: 2500 },
  { store: 'open' },
  {
    delay: 1200,
    click: {
      in: 'store',
      selector: '[data-table="User"] tbody tr[data-id]',
    },
  },
  { wait: 3700 },
];
export default autoRun;
