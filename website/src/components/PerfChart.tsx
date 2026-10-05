import type { CSSProperties } from 'react';

import styles from './PerfChart.module.css';

export interface PerfRow {
  label: string;
  /** Measurement before the change */
  baseline: number;
  /** Measurement after the change */
  value: number;
}

/** Bar chart of each row's speedup over its baseline, with exact numbers on hover or focus */
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
  // where 1x (no change) falls on the bar track, so bars read against it
  const one = {
    '--perf-one': `${(scale(1) / scaledMax) * 100}%`,
  } as CSSProperties;

  return (
    <figure className={styles.perfChart}>
      <figcaption className="text--center text--bold margin-bottom--sm">
        {title}
        {log && (
          <div className="text--normal">
            <small>Bar lengths use a log scale</small>
          </div>
        )}
      </figcaption>
      <div className={styles.bars} style={one}>
        <div className={styles.row} aria-hidden="true">
          <span />
          <span className={styles.oneLabel}>1x</span>
        </div>
        {data.map(({ label, baseline, value, speedup, multiplier }) => (
          <div className={styles.row} key={label} tabIndex={0}>
            <span className={styles.label}>{label}</span>
            <span className={styles.track} aria-hidden="true">
              <span
                className={styles.bar}
                style={
                  {
                    width: `${(scale(speedup) / scaledMax) * 100}%`,
                    '--perf-split': `${(scale(1) / (scale(speedup) || 1)) * 100}%`,
                  } as CSSProperties
                }
              />
            </span>
            <span className="text--bold">{multiplier}</span>
            {/* exact numbers stay in the DOM for crawlers and screen readers */}
            <span className={styles.tip}>
              {baselineLabel} {baseline} {unit} → {valueLabel}{' '}
              <strong>
                {value} {unit}
              </strong>
            </span>
          </div>
        ))}
      </div>
    </figure>
  );
}

function formatSpeedup(speedup: number) {
  return `${speedup >= 10 ? Math.round(speedup) : Number(speedup.toFixed(1))}x`;
}
