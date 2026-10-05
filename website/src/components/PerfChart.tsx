import type { CSSProperties } from 'react';

import styles from './PerfChart.module.css';
import usePerfTip from './usePerfTip';

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
  scaleMax,
}: {
  title: string;
  rows: PerfRow[];
  baselineLabel?: string;
  valueLabel?: string;
  unit?: string;
  /** Set for throughput metrics like ops/sec; defaults to durations where lower is better */
  higherIsBetter?: boolean;
  /** Speedup that fills a whole bar; give neighboring charts the same value so their 1x lines align */
  scaleMax?: number;
}) {
  const data = rows.map(row => {
    const speedup =
      higherIsBetter ? row.value / row.baseline : row.baseline / row.value;
    const multiplier = formatSpeedup(speedup);
    // a regression only once it shows below 1x, so 0.99x reads as no change
    return {
      ...row,
      speedup,
      multiplier,
      worse: speedup < 1 && multiplier !== '1x',
    };
  });
  const speedups = data.map(({ speedup }) => speedup);
  // log scale keeps a 3x row visible next to a 600x row; judged on this chart's rows alone
  const log = Math.max(...speedups) / Math.min(...speedups) > 10;
  const max = Math.max(...speedups, scaleMax ?? 0);
  // in log mode the track starts at 1x, or below it when a row regressed, so a slower
  // row still gets a bar and a visible gap up to 1x
  const min = Math.min(...speedups);
  const lo = min < 1 ? min / 2 : 1;
  const scale = (n: number) =>
    log ? Math.log(Math.max(n, lo)) - Math.log(lo) : n;
  const scaledMax = scale(max) || 1;
  // where 1x (no change) falls on the bar track, so bars read against it
  const tip = usePerfTip(styles.active);
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
        {data.map(({ label, baseline, value, speedup, multiplier, worse }) => (
          <div key={label} {...tip(label, styles.row)}>
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
              {worse && (
                // a regression: shade the gap between the bar and 1x
                <span
                  className={styles.shortfall}
                  style={{
                    left: `${(scale(speedup) / scaledMax) * 100}%`,
                    width: `${((scale(1) - scale(speedup)) / scaledMax) * 100}%`,
                  }}
                />
              )}
            </span>
            <span className={worse ? styles.worse : 'text--bold'}>
              {multiplier}
            </span>
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
