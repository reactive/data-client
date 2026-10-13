import type { AutoRunScript } from '../../../../Playground/preview/autorun/script';

/** Adds a task and checks one off: each list updates in place, and the
 * Store shows the new task is one Todo, in its user's list */
const autoRun: AutoRunScript = [
  {
    delay: 1000,
    type: 'input.rt-TextFieldInput',
    text: 'Try auto-run',
  },
  { delay: 300, press: 'input.rt-TextFieldInput', key: 'Enter' },
  { wait: 1500 },
  { click: '.listItem input[type="checkbox"]:not([name])' },
  { wait: 1500 },
  { store: 'open' },
  {
    delay: 1200,
    click: {
      in: 'store',
      selector: '[data-table="Todo"] tbody tr[data-id]',
      hasText: 'Try auto-run',
    },
  },
  { wait: 3700 },
];
export default autoRun;
