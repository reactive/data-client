/**
 * Observation files rerun cells whose result is React's behavior, not the
 * library's, and print each result next to the one recorded on React
 * `RECORDED_ON`. They run only with `RDC_OBSERVE=1` and do not fail on a value.
 * With `RDC_OBSERVE_OUT` set to a path, each table is also appended there.
 */
import fs from 'fs';
import { version } from 'react';

export const RECORDED_ON = '19.3.1';

export const describeObserved: jest.Describe =
  process.env.RDC_OBSERVE === '1' && Number(version.split('.')[0]) >= 19 ?
    describe
  : describe.skip;

const cell = (value: unknown) =>
  JSON.stringify(value)?.replace(/\|/g, '\\|') ?? 'undefined';

/** Rows of one Markdown table, printed by `print()` in `afterAll` */
export function observedTable(title: string) {
  const rows: string[] = [];
  return {
    row(name: string, observed: unknown, recorded: unknown) {
      const now = cell(observed);
      const then = cell(recorded);
      rows.push(
        `| ${name} | ${now === then ? 'same' : 'differs'} | ${now} | ${now === then ? '' : then} |`,
      );
    },
    print() {
      if (rows.length === 0) return;
      const text = [
        `### ${title}`,
        '',
        `| Cell | Against ${RECORDED_ON} | React ${version} | ${RECORDED_ON}, when it differs |`,
        '| --- | --- | --- | --- |',
        ...rows,
        '',
      ].join('\n');
      console.log(text);
      if (process.env.RDC_OBSERVE_OUT)
        fs.appendFileSync(process.env.RDC_OBSERVE_OUT, `${text}\n`);
    },
  };
}
