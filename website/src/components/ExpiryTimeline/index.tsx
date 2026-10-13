import { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React, { useRef, useState } from 'react';

import styles from './styles.module.css';
import StoreIcon from '../Playground/StoreIcon';

const ZONES = ['fresh', 'stale', 'invalid'] as const;
const WIDTH = 440;
// the timeline: one band per zone
const X0 = 22;
const BAND = 132;
/** Seconds the playhead takes to cross a zone; the CSS animations last this long */
const PERIOD = 4;

interface Playback {
  zone: number;
  /** seconds into the zone the current run started at */
  at: number;
  /** held at `at` while the reader scrubs */
  paused: boolean;
  /** incremented to restart the animations, so a seek lands exactly */
  run: number;
}

export default function ExpiryTimeline() {
  const [invalidIfStale, setInvalidIfStale] = useState(false);
  const [play, setPlay] = useState<Playback>({
    zone: 0,
    // what a reader who prefers reduced motion sees: the component rendered
    at: PERIOD * 0.75,
    paused: false,
    run: 0,
  });
  const svgRef = useRef<SVGSVGElement>(null);

  const scrub = (e: React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return;
    const { left, width } = svg.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * WIDTH;
    const t = Math.min(Math.max((x - X0) / BAND, 0), ZONES.length - 0.001);
    const zone = Math.floor(t);
    setPlay(p => ({
      zone,
      at: (t - zone) * PERIOD,
      paused: true,
      run: p.paused ? p.run : p.run + 1,
    }));
  };
  const resume = () => setPlay(p => ({ ...p, paused: false }));
  const advance = () =>
    setPlay(p => ({ ...p, zone: (p.zone + 1) % ZONES.length, at: 0 }));

  const invalid = translate({
    id: 'expiryTimeline.invalid',
    message: 'Invalid',
  });
  const zoneLabel = [
    translate({ id: 'expiryTimeline.fresh', message: 'Fresh' }),
    invalidIfStale ? invalid : (
      translate({ id: 'expiryTimeline.stale', message: 'Stale' })
    ),
    invalid,
  ];

  return (
    <svg
      ref={svgRef}
      className={clsx(
        styles.diagram,
        styles[ZONES[play.zone]],
        invalidIfStale && styles.invalidIfStale,
        play.paused && styles.paused,
      )}
      style={
        {
          '--seek': `${-play.at}s`,
          // where the playhead sweeps this zone
          '--x0': `${X0 + BAND * play.zone}px`,
          '--x1': `${X0 + BAND * (play.zone + 1)}px`,
        } as React.CSSProperties
      }
      viewBox={`0 0 ${WIDTH} 236`}
      role="img"
      aria-label={translate({
        id: 'expiryTimeline.label',
        message:
          'Timeline of a cached response: Fresh for dataExpiryLength, then Stale, then Invalid after ctrl.invalidate() (or straight after Fresh with invalidIfStale). A component mounting with useSuspense() renders fresh data with no request, renders stale data and refetches in the background, and on invalid data shows its fallback until the fetch resolves',
      })}
    >
      <clipPath id="expiry-track">
        <rect x={X0} y="22" width={BAND * 3} height="24" rx="6" />
      </clipPath>
      <g clipPath="url(#expiry-track)">
        {ZONES.map((zone, i) => (
          <g key={zone} className={clsx(styles.band, styles[`band${i}`])}>
            <rect x={X0 + BAND * i} y="22" width={BAND} height="24" />
            <text x={X0 + BAND * (i + 0.5)} y="38.5">
              {zoneLabel[i]}
            </text>
          </g>
        ))}
      </g>
      <rect
        className={styles.track}
        x={X0}
        y="22"
        width={BAND * 3}
        height="24"
        rx="6"
      />
      {/* the moment the response arrived */}
      <circle className={styles.arrival} cx={X0} cy="34" r="4" />

      {/* eslint-disable @docusaurus/no-untranslated-text -- API names */}
      <g className={styles.option}>
        <path d={`M${X0} 12v6M${X0} 15h${BAND}M${X0 + BAND} 12v6`} />
        <text x={X0 + BAND / 2} y="9">
          dataExpiryLength
        </text>
      </g>
      <g className={styles.option}>
        <path d={`M${X0 + BAND * 2} 12v10`} />
        <text x={X0 + BAND * 2 + 6} y="9" textAnchor="start">
          ctrl.invalidate()
        </text>
      </g>
      {/* eslint-enable @docusaurus/no-untranslated-text */}

      {/* scrubbed by hovering or dragging, or by tapping a point */}
      <rect
        className={styles.scrubber}
        x="0"
        y="0"
        width={WIDTH}
        height="66"
        onPointerDown={e => {
          e.currentTarget.setPointerCapture(e.pointerId);
          scrub(e);
        }}
        onPointerMove={scrub}
        onPointerUp={e => {
          if (e.pointerType === 'touch') resume();
        }}
        onPointerCancel={resume}
        onPointerLeave={resume}
      />

      <g
        className={clsx(styles.toggle, invalidIfStale && styles.on)}
        role="switch"
        aria-checked={invalidIfStale}
        onClick={e => {
          e.stopPropagation();
          setInvalidIfStale(on => !on);
        }}
      >
        <rect x="156" y="1" width="128" height="17" rx="8.5" />
        <rect className={styles.switch} x="164" y="5" width="17" height="9" />
        <circle className={styles.knob} cx="168.5" cy="9.5" r="3" />
        {/* eslint-disable-next-line @docusaurus/no-untranslated-text -- API name */}
        <text x="232" y="13">
          invalidIfStale
        </text>
      </g>

      <g key={`${play.zone}-${play.run}`}>
        <g
          className={clsx(styles.anim, styles.playhead)}
          onAnimationIteration={advance}
        >
          <line x1="0" y1="17" x2="0" y2="51" />
          <circle cx="0" cy="54" r="4.5" />
        </g>

        {/* the request: out of the component, into the API and back into the store */}
        <g className={clsx(styles.anim, styles.chip)}>
          <g className={clsx(styles.anim, styles.request)}>
            <rect x="-16" y="-8" width="32" height="16" rx="8" />
            {/* eslint-disable-next-line @docusaurus/no-untranslated-text -- HTTP method */}
            <text y="3.5">GET</text>
          </g>
          <g className={clsx(styles.anim, styles.response)}>
            <rect x="-16" y="-8" width="32" height="16" rx="8" />
            <rect x="-9" y="-3" width="14" height="2.5" rx="1.25" />
            <rect x="-9" y="1" width="9" height="2.5" rx="1.25" />
          </g>
        </g>

        <g className={styles.store}>
          <rect
            className={styles.panel}
            x="14"
            y="116"
            width="104"
            height="66"
          />
          <rect
            className={clsx(styles.anim, styles.flash, styles.arrive)}
            x="14"
            y="116"
            width="104"
            height="66"
          />
          <StoreIcon
            className={styles.db}
            x="24"
            y="138"
            width="22"
            height="22"
          />
          <g className={clsx(styles.anim, styles.kept)}>
            {[52, 36, 44].map((w, i) => (
              <rect
                key={i}
                className={clsx(styles.anim, styles.bar)}
                x="56"
                y={131 + i * 14}
                width={w}
                height="8"
              />
            ))}
          </g>
        </g>

        <path
          className={clsx(styles.anim, styles.read)}
          d="M122 149H163M158 144.5L163.5 149L158 153.5"
        />

        <g className={clsx(styles.anim, styles.comp)}>
          <rect
            className={clsx(styles.anim, styles.flash, styles.render)}
            x="168"
            y="108"
            width="104"
            height="82"
          />
          <rect
            className={clsx(styles.anim, styles.panel, styles.box)}
            x="168"
            y="108"
            width="104"
            height="82"
          />
          {/* eslint-disable-next-line @docusaurus/no-untranslated-text -- API name */}
          <text className={styles.hook} x="220" y="124">
            useSuspense()
          </text>
          <g className={clsx(styles.anim, styles.shown)}>
            {[68, 44, 56].map((w, i) => (
              <rect
                key={i}
                className={clsx(styles.anim, styles.bar)}
                x="186"
                y={140 + i * 14}
                width={w}
                height="8"
              />
            ))}
          </g>
          {/* the suspense fallback */}
          <g className={clsx(styles.anim, styles.fallback)}>
            <rect x="168" y="108" width="104" height="82" />
            <circle className={styles.spin} cx="220" cy="156" r="11" />
          </g>
        </g>

        <path
          className={styles.api}
          transform="translate(330 120) scale(3.4)"
          d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"
        />
      </g>
    </svg>
  );
}
