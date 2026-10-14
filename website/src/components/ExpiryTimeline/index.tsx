import { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React, { useEffect, useId, useRef, useState } from 'react';

import Sequence from './designs/Sequence';
import Slider from './designs/Slider';
import Storyboard from './designs/Storyboard';
import splitAtHeadings from './splitAtHeadings';
import styles from './styles.module.css';
import StoreIcon from '../Playground/StoreIcon';

const ZONES = ['fresh', 'stale', 'invalid'] as const;
const WIDTH = 440;
const HEIGHT = 236;
/** The viewBox starts above y=0, so the switch and labels aren't flush with its top edge */
const TOP = -4;
// the timeline: one band per zone
const X0 = 22;
const BAND = 132;
/** Seconds the playhead takes to cross a zone (the CSS animations' duration) */
const PERIOD = 4;
// the annotation row over the timeline: labels on one baseline, each with
// the bracket or tick that shows what it governs
const LABEL_Y = 9;
const BRACKET_Y = 15;
// the invalidIfStale switch, drawn before its label
const SWITCH = { x: 166, y: 1, w: 16, h: 9 };
/** The bottom of the annotation row, in SVG units: the HTML controls cover it */
const ANNOTATION_BOTTOM = 20;
/** The controls' height, as a CSS percentage of the stage */
const ANNOTATION_HEIGHT = `${((ANNOTATION_BOTTOM - TOP) / (HEIGHT - TOP)) * 100}%`;

interface Playback {
  zone: number;
  /** seconds into the zone the current run started at */
  at: number;
  /** held at `at` while the reader scrubs */
  paused: boolean;
  /** incremented to restart the animations, so each seek lands exactly */
  run: number;
}

// TEMPORARY while choosing a design: ?design= picks one, and the picker
// above it switches; keep only the chosen one before merging
const DESIGNS = {
  timeline: Timeline,
  slider: Slider,
  storyboard: Storyboard,
  sequence: Sequence,
};
type Design = keyof typeof DESIGNS;

export default function ExpiryTimeline({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [design, setDesign] = useState<Design>('timeline');
  useEffect(() => {
    const d = new URLSearchParams(window.location.search).get('design');
    if (d && d in DESIGNS) setDesign(d as Design);
  }, []);
  const choose = (d: Design) => {
    setDesign(d);
    const url = new URL(window.location.href);
    url.searchParams.set('design', d);
    window.history.replaceState(window.history.state, '', url);
  };
  const Chosen = DESIGNS[design];
  return (
    <>
      <div className={styles.picker} role="group" aria-label="Design">
        {(Object.keys(DESIGNS) as Design[]).map(d => (
          <button
            key={d}
            type="button"
            aria-pressed={d === design}
            onClick={() => choose(d)}
          >
            {d}
          </button>
        ))}
      </div>
      <Chosen>{children}</Chosen>
    </>
  );
}

/**
 * The expiry timeline, with the page's Fresh / Stale / Invalid sections laid
 * out below it in band order: `children` is split into a column at each heading.
 */
function Timeline({ children }: { children?: React.ReactNode }) {
  const [invalidIfStale, setInvalidIfStale] = useState(false);
  const [play, setPlay] = useState<Playback>({
    zone: 0,
    at: 0,
    paused: false,
    run: 0,
  });
  const svgRef = useRef<SVGSVGElement>(null);

  // unthrottled: browsers mostly coalesce pointermove to one per frame, and
  // React batches moves that land in one task, so a fast drag stays cheap
  const scrub = (e: React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return;
    const { left, width } = svg.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * WIDTH;
    // just short of the end, so the last zone's end stays in that zone
    const t = Math.min(Math.max((x - X0) / BAND, 0), ZONES.length - 0.001);
    const zone = Math.floor(t);
    const at = (t - zone) * PERIOD;
    setPlay(p =>
      p.paused && p.zone === zone && p.at === at ?
        p
        // browsers only honor a delay change on a fresh animation, so restart
      : { zone, at, paused: true, run: p.run + 1 },
    );
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
    <div
      className={clsx(styles.frame, invalidIfStale && styles.invalidIfStale)}
    >
      <div className={styles.stage}>
        <svg
          ref={svgRef}
          className={clsx(
            styles.diagram,
            styles[ZONES[play.zone]],
            play.paused && styles.paused,
            // run stays 0 until the reader first scrubs
            !play.run && styles.unseeked,
          )}
          style={
            {
              '--period': `${PERIOD}s`,
              '--at': `${-play.at}s`,
              // where the playhead sweeps this zone
              '--x0': `${X0 + BAND * play.zone}px`,
              '--x1': `${X0 + BAND * (play.zone + 1)}px`,
            } as React.CSSProperties
          }
          viewBox={`0 ${TOP} ${WIDTH} ${HEIGHT - TOP}`}
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
          {/* dataExpiryLength spans Fresh */}
          <g className={styles.option}>
            <path d={bracket(X0, X0 + BAND)} />
            <text x={X0 + BAND / 2} y={LABEL_Y}>
              dataExpiryLength
            </text>
          </g>
          {/* invalidIfStale spans Stale, which it turns Invalid */}
          <g className={clsx(styles.option, invalidIfStale && styles.on)}>
            <path d={bracket(X0 + BAND, X0 + BAND * 2)} />
            <rect
              className={styles.switch}
              x={SWITCH.x}
              y={SWITCH.y}
              width={SWITCH.w}
              height={SWITCH.h}
            />
            <circle
              className={styles.knob}
              cx={SWITCH.x + SWITCH.h / 2}
              cy={SWITCH.y + SWITCH.h / 2}
              r="3"
            />
            <text x={SWITCH.x + SWITCH.w + 4} y={LABEL_Y} textAnchor="start">
              invalidIfStale
            </text>
          </g>
          {/* ctrl.invalidate() marks the moment Stale ends */}
          <g className={styles.option}>
            <path d={`M${X0 + BAND * 2} ${BRACKET_Y - 3}v10`} />
            <text x={X0 + BAND * 2 + 6} y={LABEL_Y} textAnchor="start">
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
            // a mouse keeps scrubbing while it hovers; a finger lifting plays on
            onPointerUp={e => {
              if (e.pointerType === 'touch') resume();
            }}
            onPointerCancel={resume}
            onPointerLeave={resume}
          />

          <g key={`${play.zone}-${play.run}`}>
            <g
              className={clsx(styles.anim, styles.playhead)}
              onAnimationIteration={advance}
            >
              <line x1="0" y1="17" x2="0" y2="51" />
              <circle cx="0" cy="54" r="4.5" />
            </g>
            <Request />
            <Store />
            <path
              className={clsx(styles.anim, styles.read)}
              d="M122 149H163M158 144.5L163.5 149L158 153.5"
            />
            <Component />
            <path
              className={styles.api}
              transform="translate(330 120) scale(3.4)"
              d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"
            />
          </g>
        </svg>
        <Annotations
          invalidIfStale={invalidIfStale}
          onToggle={() => setInvalidIfStale(on => !on)}
        />
      </div>
      {children && (
        <div className={styles.columns}>
          {splitAtHeadings(children).map((column, i) => (
            <section
              key={i}
              className={clsx(styles.column, styles[`band${i}`])}
            >
              {column}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

/** A bracket under a label, from one band edge to the other */
function bracket(x0: number, x1: number) {
  return `M${x0} ${BRACKET_Y - 3}v6M${x0} ${BRACKET_Y}H${x1}M${x1} ${
    BRACKET_Y - 3
  }v6`;
}

/**
 * The real controls over the drawn annotations, one per band: links for the
 * options and a switch for invalidIfStale, each explained in a tooltip on
 * hover, keyboard focus, or a tap. The SVG is an image, so these stay HTML.
 */
function Annotations({
  invalidIfStale,
  onToggle,
}: {
  invalidIfStale: boolean;
  onToggle: () => void;
}) {
  // which tooltip a tap pinned open; a tap elsewhere closes it
  const [open, setOpen] = useState<number | null>(null);
  const pointerType = useRef<string | null>(null);
  const pinned = open !== null;
  useEffect(() => {
    if (!pinned) return;
    const close = (e: PointerEvent) => {
      if (!(e.target as Element).closest?.(`.${styles.annotation}`))
        setOpen(null);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [pinned]);
  // Escape hides any tooltip, hovered ones too, until the pointer next enters
  // or presses a label, or anything in it takes focus
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    const dismiss = (e: KeyboardEvent) => {
      // an Escape another widget already handled is that widget's
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      // focus stays put, except on a link in the tip this hides: it returns
      // to that tip's label, before the dismissal so this focus can't revive it
      const active = document.activeElement;
      if (active?.closest(`.${styles.tip}`))
        active
          .closest(`.${styles.annotation}`)
          ?.querySelector<HTMLElement>(`.${styles.control}`)
          ?.focus();
      setOpen(null);
      setDismissed(true);
    };
    document.addEventListener('keydown', dismiss);
    return () => document.removeEventListener('keydown', dismiss);
  }, []);
  const revive = () => setDismissed(false);
  const id = useId();

  const learnMore = translate({
    id: 'expiryTimeline.learnMore',
    message: 'Learn more',
    description:
      'Link in each tooltip of the expiry timeline diagram, to the section explaining that option',
  });
  const annotations = [
    {
      name: 'dataExpiryLength',
      href: '#endpointdataexpirylength',
      tip: translate({
        id: 'expiryTimeline.dataExpiryLength',
        message:
          'How long (in milliseconds) a response stays fresh before it becomes stale.',
        description:
          'Tooltip on the dataExpiryLength annotation of the expiry timeline diagram',
      }),
      align: styles.left,
    },
    {
      name: 'invalidIfStale',
      href: '#endpointinvalidifstale',
      tip: translate({
        id: 'expiryTimeline.invalidIfStale',
        message:
          'When on, data skips Stale and becomes invalid as soon as it expires, so it must refetch before it can render.',
        description:
          'Tooltip on the invalidIfStale switch of the expiry timeline diagram',
      }),
      align: styles.center,
    },
    {
      name: 'ctrl.invalidate()',
      href: '#invalidate',
      tip: translate({
        id: 'expiryTimeline.invalidate',
        message:
          'Marks the data invalid right away, even while fresh, so components that need it fetch again.',
        description:
          'Tooltip on the ctrl.invalidate() annotation of the expiry timeline diagram',
      }),
      align: styles.right,
    },
  ];

  return annotations.map(({ name, href, tip, align }, i) => {
    const tipId = `${id}-${i}`;
    const control = {
      className: styles.control,
      'aria-label': name,
      'aria-describedby': tipId,
      onPointerDown: (e: React.PointerEvent) => {
        pointerType.current = e.pointerType;
      },
    };
    // keyboard activation (detail 0) is never a tap, whatever came before
    const tapped = (e: React.MouseEvent) => {
      const touch = e.detail > 0 && pointerType.current === 'touch';
      pointerType.current = null;
      return touch;
    };
    return (
      <span
        key={name}
        className={clsx(
          styles.annotation,
          align,
          open === i && styles.open,
          dismissed && styles.dismissed,
        )}
        onPointerEnter={revive}
        onPointerDown={revive}
        onFocus={revive}
        style={{
          left: `${((X0 + BAND * i) / WIDTH) * 100}%`,
          width: `${(BAND / WIDTH) * 100}%`,
          height: ANNOTATION_HEIGHT,
        }}
      >
        {name === 'invalidIfStale' ?
          <button
            type="button"
            role="switch"
            aria-checked={invalidIfStale}
            {...control}
            onClick={e => {
              onToggle();
              // a finger can't hover, so a tap also shows the explanation
              setOpen(tapped(e) ? i : null);
            }}
          />
        : <a
            href={href}
            {...control}
            onClick={e => {
              // a first tap explains; the link in the tooltip, or a second
              // tap, follows through
              if (tapped(e) && open !== i) {
                e.preventDefault();
                setOpen(i);
              } else setOpen(null);
            }}
          />
        }
        <span className={styles.tip} id={tipId}>
          <span className={styles.bubble}>
            {tip} <a href={href}>{learnMore}</a>
          </span>
        </span>
      </span>
    );
  });
}

/** The request: out of the component, into the API and back into the store */
function Request() {
  return (
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
  );
}

/** The cached response; its data flashes when a new response lands */
function Store() {
  return (
    <g className={styles.store}>
      <rect className={styles.panel} x="14" y="116" width="104" height="66" />
      <rect
        className={clsx(styles.anim, styles.flash, styles.arrive)}
        x="14"
        y="116"
        width="104"
        height="66"
      />
      <StoreIcon className={styles.db} x="24" y="138" width="22" height="22" />
      <g className={clsx(styles.anim, styles.kept)}>
        <Bars x={56} y={131} widths={[52, 36, 44]} />
      </g>
    </g>
  );
}

/** A component mounting at the playhead: data it renders, or its fallback */
function Component() {
  return (
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
        <Bars x={186} y={140} widths={[68, 44, 56]} />
      </g>
      <g className={clsx(styles.anim, styles.fallback)}>
        <rect x="168" y="108" width="104" height="82" />
        <circle className={styles.spin} cx="220" cy="156" r="11" />
      </g>
    </g>
  );
}

/** Lines of data, colored by how fresh they are */
function Bars({ x, y, widths }: { x: number; y: number; widths: number[] }) {
  return widths.map((w, i) => (
    <rect
      key={i}
      className={clsx(styles.anim, styles.bar)}
      x={x}
      y={y + i * 14}
      width={w}
      height="8"
    />
  ));
}
