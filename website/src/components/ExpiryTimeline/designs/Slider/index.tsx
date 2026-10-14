import { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React, { useEffect, useId, useState } from 'react';

import styles from './styles.module.css';
import StoreIcon from '../../../Playground/StoreIcon';
import splitAtHeadings from '../../splitAtHeadings';
import base from '../../styles.module.css';

const ZONES = ['fresh', 'stale', 'invalid'] as const;
type Zone = (typeof ZONES)[number];

/** The slider's range: time since the response arrived, in % of the track */
const MAX = 100;
/** Where dataExpiryLength passes on that track */
const EXPIRY = 50;
/** Where time stands before the reader touches anything (and under reduced motion) */
const START = 30;
/** Milliseconds per slider step while idling: 6s to cross the track */
const IDLE_STEP = 60;

/**
 * A control model of expiry: a range sets the time since fetch, a switch sets
 * invalidIfStale and a button calls ctrl.invalidate(). The store entry and a
 * useSuspense() component mounting at that moment show the result, and the
 * page's Fresh / Stale / Invalid section that applies is highlighted below.
 */
export default function Slider({ children }: { children?: React.ReactNode }) {
  const [age, setAge] = useState(START);
  const [invalidIfStale, setInvalidIfStale] = useState(false);
  const [invalidated, setInvalidated] = useState(false);
  // time passes on its own until the reader first takes a control
  const [idle, setIdle] = useState(true);
  useEffect(() => {
    if (!idle) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(
      () => setAge(a => (a >= MAX ? 0 : a + 1)),
      IDLE_STEP,
    );
    return () => clearInterval(timer);
  }, [idle]);
  const engage = () => setIdle(false);

  const expired = age >= EXPIRY;
  const zone: Zone =
    invalidated || (expired && invalidIfStale) ? 'invalid'
    : expired ? 'stale'
    : 'fresh';
  const zoneName = {
    fresh: translate({ id: 'expirySlider.fresh', message: 'Fresh' }),
    stale: translate({ id: 'expirySlider.stale', message: 'Stale' }),
    invalid: translate({ id: 'expirySlider.invalid', message: 'Invalid' }),
  };
  const id = useId();

  return (
    <div
      className={clsx(
        base.frame,
        styles.slider,
        styles[zone],
        invalidIfStale && styles.ifStaleOn,
        invalidated && styles.invalidated,
      )}
    >
      <div
        className={styles.panel}
        role="group"
        aria-label={translate({
          id: 'expirySlider.label',
          message:
            'Expiry policy model: set the time since fetch, invalidIfStale and ctrl.invalidate(), and see what a mounting useSuspense() component does',
        })}
        onPointerDown={engage}
        onKeyDown={engage}
        style={{ '--age': age } as React.CSSProperties}
      >
        <div className={styles.cards}>
          <StoreCard status={zoneName[zone]} />
          <svg
            className={styles.read}
            viewBox="0 0 40 16"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M2 8h34M30 2.5L36 8L30 13.5" />
          </svg>
          <ComponentCard />
        </div>

        <div className={styles.timeline}>
          {/* eslint-disable @docusaurus/no-untranslated-text -- API names */}
          <span className={clsx(styles.option, styles.expiry)}>
            <a href="#endpointdataexpirylength">dataExpiryLength</a>
          </span>
          <span className={clsx(styles.option, styles.ifStale)}>
            <button
              type="button"
              role="switch"
              aria-checked={invalidIfStale}
              aria-labelledby={`${id}-ifstale`}
              className={styles.switch}
              onClick={() => setInvalidIfStale(on => !on)}
            >
              <span className={styles.knob} />
            </button>
            <a id={`${id}-ifstale`} href="#endpointinvalidifstale">
              invalidIfStale
            </a>
          </span>
          {/* eslint-enable @docusaurus/no-untranslated-text */}

          <div className={styles.track}>
            <span className={clsx(styles.band, styles.band0)}>
              {zoneName.fresh}
            </span>
            <span className={clsx(styles.band, styles.band1)}>
              {invalidIfStale ? zoneName.invalid : zoneName.stale}
            </span>
            <span className={styles.elapsed} />
            <span className={styles.arrival} />
            <input
              className={styles.range}
              type="range"
              min={0}
              max={MAX}
              step={1}
              value={age}
              aria-label={translate({
                id: 'expirySlider.age',
                message: 'Time since fetch',
              })}
              aria-valuetext={translate(
                {
                  id: 'expirySlider.ageValue',
                  message: '{times} times dataExpiryLength: {status}',
                  description:
                    'Spoken value of the time-since-fetch slider in the expiry diagram',
                },
                { times: (age / EXPIRY).toFixed(1), status: zoneName[zone] },
              )}
              onChange={e => {
                engage();
                setAge(e.currentTarget.valueAsNumber);
              }}
            />
          </div>

          <span className={styles.axis}>
            {translate({
              id: 'expirySlider.axis',
              message: 'time since fetch',
            })}
          </span>
          {/* eslint-disable @docusaurus/no-untranslated-text -- API name, and a glyph */}
          <span className={styles.invalidate}>
            <button
              type="button"
              className={styles.call}
              aria-pressed={invalidated}
              onClick={() => setInvalidated(on => !on)}
            >
              ctrl.invalidate()
            </button>
            <a
              className={styles.docs}
              href="#invalidate"
              aria-label={translate({
                id: 'expirySlider.invalidateDocs',
                message: 'About ctrl.invalidate()',
              })}
            >
              ?
            </a>
          </span>
          {/* eslint-enable @docusaurus/no-untranslated-text */}
        </div>
      </div>

      {children && (
        <div className={base.columns}>
          {splitAtHeadings(children).map((column, i) => (
            <section
              key={i}
              className={clsx(
                base.column,
                base[`band${i}`],
                ZONES[i] !== zone && styles.inactive,
              )}
            >
              {column}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

/** The cached response and how fresh it is now */
function StoreCard({ status }: { status: string }) {
  return (
    <div className={clsx(styles.card, styles.store)}>
      <div className={styles.head}>
        <StoreIcon className={styles.db} />
        <span className={styles.status} role="status">
          {status}
        </span>
      </div>
      <Bars className={styles.kept} widths={[82, 56, 70]} />
    </div>
  );
}

/** A component mounting now: the data it renders, or its fallback, and any fetch */
function ComponentCard() {
  return (
    <div className={clsx(styles.card, styles.comp)}>
      <div className={styles.head}>
        {/* eslint-disable-next-line @docusaurus/no-untranslated-text -- API name */}
        <span className={styles.hook}>useSuspense()</span>
      </div>
      <div className={styles.body}>
        <Bars className={styles.shown} widths={[82, 56, 70]} />
        <span className={styles.fallback} aria-hidden="true">
          <span className={styles.spin} />
        </span>
      </div>
      <span className={styles.request} aria-hidden="true">
        {/* eslint-disable-next-line @docusaurus/no-untranslated-text -- HTTP method */}
        <span className={styles.chip}>GET</span>
        <svg className={styles.api} viewBox="0 0 24 24" focusable="false">
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
        </svg>
      </span>
    </div>
  );
}

/** Lines of data, colored by how fresh they are */
function Bars({ className, widths }: { className: string; widths: number[] }) {
  return (
    <span className={clsx(styles.bars, className)} aria-hidden="true">
      {widths.map((w, i) => (
        <span key={i} className={styles.bar} style={{ width: `${w}%` }} />
      ))}
    </span>
  );
}
