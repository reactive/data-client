import type { ReactNode } from 'react';

import styles from './PerfTable.module.css';

export interface PerfTableRow {
  label: string;
  description?: ReactNode;
  /** One [before, after] pair per column */
  values: [number, number][];
}

/** Before/after results across several metrics, each cell with a change badge and paired bars */
export default function PerfTable({
  columns,
  rows,
}: {
  /** Header and unit of each metric; lower is better */
  columns: { label: string; unit: string }[];
  rows: PerfTableRow[];
}) {
  return (
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
              return (
                <td key={columns[i].label}>
                  <div className={styles.values}>
                    <span className={styles.before}>
                      {before}
                      {unit}
                    </span>
                    <span>→</span>
                    <strong>
                      {after}
                      {unit}
                    </strong>
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
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
