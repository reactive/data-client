import { Fragment } from 'react';

import styles from './PerfChart.module.css';

export interface PerfRow {
  label: string;
  /** Measurement before the change */
  baseline: number;
  /** Measurement after the change */
  value: number;
}

/** Benchmark results as a table plus a bar chart of each row's speedup over its baseline */
export default function PerfChart({
  title,
  rows,
  baselineLabel = 'Before',
  valueLabel = 'After',
  unit = 'ms',
  higherIsBetter = false,
}: {
  title: string;
  rows: PerfRow[];
  baselineLabel?: string;
  valueLabel?: string;
  unit?: string;
  /** Set for throughput metrics like ops/sec; defaults to durations where lower is better */
  higherIsBetter?: boolean;
}) {
  const data = rows.map(row => {
    const speedup =
      higherIsBetter ? row.value / row.baseline : row.baseline / row.value;
    return { ...row, speedup, multiplier: formatSpeedup(speedup) };
  });
  const speedups = data.map(({ speedup }) => speedup);
  const max = Math.max(...speedups);
  // log scale keeps a 3x row visible next to a 600x row
  const log = max / Math.min(...speedups) > 10;
  const scale = (n: number) => (log ? Math.log(Math.max(n, 1)) : n);
  const scaledMax = scale(max) || 1;

  return (
    <figure className={styles.perfChart}>
      <figcaption className="text--center text--bold margin-bottom--sm">
        {title}
      </figcaption>
      <div className={styles.bars} aria-hidden="true">
        {data.map(({ label, speedup, multiplier }) => (
          <Fragment key={label}>
            <span className={styles.label}>{label}</span>
            <span className={styles.track}>
              <span
                className={styles.bar}
                style={{ width: `${(scale(speedup) / scaledMax) * 100}%` }}
              />
            </span>
            <span className="text--bold">{multiplier}</span>
          </Fragment>
        ))}
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th />
            <th>
              {baselineLabel} ({unit})
            </th>
            <th>
              {valueLabel} ({unit})
            </th>
            <th>Speedup</th>
          </tr>
        </thead>
        <tbody>
          {data.map(({ label, baseline, value, multiplier }) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              <td>{baseline}</td>
              <td>{value}</td>
              <td>{multiplier}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function formatSpeedup(speedup: number) {
  return `${speedup >= 10 ? Math.round(speedup) : Number(speedup.toFixed(1))}x`;
}
