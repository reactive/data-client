import type { AutoRunScript } from '../../../../Playground/preview/autorun/script';

/** Adds a task and checks another off: the lists update in place, and the
 * Store shows the new task is one Todo, in its user's list */
const autoRun: AutoRunScript = [
  {
    delay: 1000,
    type: 'input.rt-TextFieldInput',
    text: 'Try auto-run',
  },
  { delay: 300, press: 'input.rt-TextFieldInput', key: 'Enter' },
  { wait: 1500 },
  // the first task the API had (the new one has no record there to update;
  // the add-task row's checkbox is the one named "new")
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
