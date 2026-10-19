import type { ReactNode } from 'react';

import styles from './PerfTable.module.css';
import tipStyles from './tips.module.css';
import useTips from './useTips';

export interface PerfTableRow {
  label: string;
  description?: ReactNode;
  /** One [before, after] pair per column */
  values: [number, number][];
}

/** Before/after results across several metrics; cells show the change, with exact numbers on hover or focus */
export default function PerfTable({
  columns,
  rows,
}: {
  /** Header and unit of each metric; lower is better */
  columns: { label: string; unit: string }[];
  rows: PerfTableRow[];
}) {
  const tips = useTips<string>();
  return (
    <div className={styles.scroll}>
      <table className={styles.perfTable}>
        <thead>
          <tr>
            <th />
            {columns.map(({ label }) => (
              <th key={label}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ label, description, values }) => (
            <tr key={label}>
              <th scope="row">
                {label}
                {description && (
                  <div className={styles.description}>{description}</div>
                )}
              </th>
              {values.map(([before, after], i) => {
                const { unit } = columns[i];
                const change = Math.round(((after - before) / before) * 100);
                const max = Math.max(before, after);
                const key = `${label}-${i}`;
                return (
                  <td
                    key={columns[i].label}
                    {...tips.anchor(key)}
                    tabIndex={0}
                    onClick={() => tips.toggle(key)}
                  >
                    <div className={styles.cell}>
                      <div className={styles.bars} aria-hidden="true">
                        <span
                          className={styles.barBefore}
                          style={{ width: `${(before / max) * 100}%` }}
                        />
                        <span
                          className={styles.barAfter}
                          style={{ width: `${(after / max) * 100}%` }}
                        />
                      </div>
                      <span
                        className={
                          change < 0 ? styles.better
                          : change > 0 ?
                            styles.worse
                          : styles.same
                        }
                      >
                        {change === 0 ?
                          'same'
                        : `${change > 0 ? '+' : ''}${change}%`}
                      </span>
                    </div>
                    {/* exact numbers stay in the DOM for crawlers and screen readers */}
                    <span className={styles.tip}>
                      <span className={tipStyles.bubble}>
                        {before}
                        {unit} →{' '}
                        <strong>
                          {after}
                          {unit}
                        </strong>
                      </span>
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
