import { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React, { useEffect, useId, useRef, useState } from 'react';

import splitAtHeadings from './splitAtHeadings';
import styles from './styles.module.css';
import StoreIcon from '../Playground/StoreIcon';

const ZONES = ['fresh', 'stale', 'invalid'] as const;
/** The invalidIfStale switch's tooltip, after the three columns' */
const SWITCH_TIP = 3;

/**
 * Three stories side by side, one per status, in sync: a component mounts
 * with useSuspense() and reads the store, requests (or not) and shows data
 * or a fallback. Each sits over its section's text, so the column is the
 * story and its explanation; the invalidIfStale switch over the Stale
 * column turns that story into Invalid's.
 */
export default function ExpiryTimeline({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [invalidIfStale, setInvalidIfStale] = useState(false);
  const columns = splitAtHeadings(children);
  const tips = useTips();

  // how each status comes about, over its story
  const when = [
    {
      prefix: translate({
        id: 'expiryTimeline.within',
        message: 'within',
        description:
          'Before the dataExpiryLength option name, over the Fresh story: a mount within that time finds fresh data',
      }),
      name: 'dataExpiryLength',
      href: '#endpointdataexpirylength',
      tip: translate({
        id: 'expiryTimeline.dataExpiryLength',
        message:
          'How long (in milliseconds) a response stays fresh before it becomes stale.',
        description:
          'Tooltip on the dataExpiryLength label of the expiry diagram',
      }),
    },
    {
      prefix: translate({
        id: 'expiryTimeline.after',
        message: 'after',
        description:
          'Before the dataExpiryLength option name, over the Stale story: a mount after that time finds stale data',
      }),
      name: 'dataExpiryLength',
      href: '#endpointdataexpirylength',
      tip:
        invalidIfStale ?
          translate({
            id: 'expiryTimeline.afterInvalidIfStale',
            message:
              'With invalidIfStale, once dataExpiryLength (in milliseconds) has passed, the cached response is invalid: it must refetch before it can render.',
            description:
              'Tooltip on the Stale story’s dataExpiryLength label of the expiry diagram, while its invalidIfStale switch is on',
          })
        : translate({
            id: 'expiryTimeline.afterDataExpiryLength',
            message:
              'Once dataExpiryLength (in milliseconds) has passed, the cached response is stale: still shown, but refetched.',
            description:
              'Tooltip on the Stale story’s dataExpiryLength label of the expiry diagram',
          }),
    },
    {
      prefix: translate({
        id: 'expiryTimeline.afterCall',
        message: 'after',
        description:
          'Before ctrl.invalidate(), over the Invalid story: a mount after that call finds invalid data',
      }),
      name: 'ctrl.invalidate()',
      href: '#invalidate',
      tip: translate({
        id: 'expiryTimeline.invalidate',
        message:
          'Marks the data invalid right away, even while fresh, so components that need it fetch again.',
        description:
          'Tooltip on the ctrl.invalidate() label of the expiry diagram',
      }),
    },
  ];
  // what each story shows, for screen readers
  const stories = {
    fresh: translate({
      id: 'expiryTimeline.storyFresh',
      message:
        'A component mounting with useSuspense() renders the fresh data in the store, with no request',
      description: 'Accessible label of the Fresh story in the expiry diagram',
    }),
    stale: translate({
      id: 'expiryTimeline.storyStale',
      message:
        'A component mounting with useSuspense() renders the stale data in the store and refetches it in the background',
      description: 'Accessible label of the Stale story in the expiry diagram',
    }),
    invalid: translate({
      id: 'expiryTimeline.storyInvalid',
      message:
        'A component mounting with useSuspense() shows its fallback until the fetch of the invalid data resolves',
      description:
        'Accessible label of the Invalid story in the expiry diagram',
    }),
  };
  const switchTip = translate({
    id: 'expiryTimeline.invalidIfStale',
    message:
      'When on, data skips Stale and becomes invalid as soon as it expires, so it must refetch before it can render.',
    description: 'Tooltip on the invalidIfStale switch of the expiry diagram',
  });

  return (
    <div
      className={clsx(styles.frame, invalidIfStale && styles.invalidIfStale)}
    >
      <div className={styles.board}>
        {ZONES.map((zone, i) => {
          // the switch turns the Stale panel into Invalid's story
          const shown = zone === 'stale' && invalidIfStale ? 'invalid' : zone;
          return (
            <React.Fragment key={zone}>
              {/* the row over the panels: the switch, over Stale */}
              <div className={styles.above}>
                {zone === 'stale' && (
                  <Tip
                    tips={tips}
                    index={SWITCH_TIP}
                    tip={switchTip}
                    href="#endpointinvalidifstale"
                    align={styles.center}
                  >
                    {(control, tapped) => (
                      <button
                        type="button"
                        role="switch"
                        aria-checked={invalidIfStale}
                        className={clsx(styles.control, styles.switch)}
                        {...control}
                        onClick={e => {
                          setInvalidIfStale(on => !on);
                          // a finger can't hover, so a tap also explains
                          tips.setOpen(tapped(e) ? SWITCH_TIP : null);
                        }}
                      >
                        <span className={styles.track}>
                          <span className={styles.knob} />
                        </span>
                        {/* eslint-disable-next-line @docusaurus/no-untranslated-text -- API name */}
                        <code>invalidIfStale</code>
                      </button>
                    )}
                  </Tip>
                )}
              </div>
              <div
                className={clsx(
                  styles.panel,
                  styles[zone],
                  styles[`band${i}`],
                  shown !== zone && styles.invalid,
                )}
              >
                <div className={styles.head}>
                  <Tip
                    tips={tips}
                    index={i}
                    tip={when[i].tip}
                    href={when[i].href}
                    align={zone === 'invalid' ? styles.right : styles.left}
                  >
                    {(control, tapped) => (
                      <a
                        href={when[i].href}
                        className={clsx(styles.control, styles.when)}
                        {...control}
                        onClick={e => {
                          // a first tap explains; the link in the tooltip, or
                          // a second tap, follows through
                          if (tapped(e) && tips.open !== i) {
                            e.preventDefault();
                            tips.setOpen(i);
                          } else tips.setOpen(null);
                        }}
                      >
                        <span className={styles.prefix}>{when[i].prefix}</span>{' '}
                        <code>{when[i].name}</code>
                      </a>
                    )}
                  </Tip>
                </div>
                <Story label={stories[shown]} />
              </div>
              <section className={clsx(styles.text, styles[`band${i}`])}>
                {columns[i]}
              </section>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/**
 * One mount story: the store, a component mounting with useSuspense(), and
 * the API; what it shows and whether it requests come from the panel's zone.
 */
function Story({ label }: { label: string }) {
  return (
    <svg
      className={styles.story}
      viewBox="0 0 180 100"
      role="img"
      aria-label={label}
    >
      {/* the cached response; dims while nothing may show it */}
      <g className={styles.store}>
        <rect className={styles.box} x="4" y="24" width="56" height="48" />
        <rect
          className={clsx(styles.anim, styles.flash, styles.arrive)}
          x="4"
          y="24"
          width="56"
          height="48"
        />
        <StoreIcon className={styles.db} x="9" y="41" width="14" height="14" />
        <g className={clsx(styles.anim, styles.kept)}>
          <Bars x={27} y={33} widths={[28, 18, 24]} />
        </g>
      </g>
      {/* the read, store to component */}
      <path
        className={clsx(styles.anim, styles.read)}
        d="M62 48H75M71 44.5L75.5 48L71 51.5"
      />
      {/* the component: data it renders, or its fallback */}
      <g className={clsx(styles.anim, styles.comp)}>
        <rect
          className={clsx(styles.anim, styles.flash, styles.render)}
          x="78"
          y="16"
          width="62"
          height="64"
        />
        <rect
          className={clsx(styles.anim, styles.box, styles.outline)}
          x="78"
          y="16"
          width="62"
          height="64"
        />
        {/* eslint-disable-next-line @docusaurus/no-untranslated-text -- API name */}
        <text className={styles.hook} x="109" y="28">
          useSuspense()
        </text>
        <g className={clsx(styles.anim, styles.shown)}>
          <Bars x={88} y={38} widths={[42, 26, 34]} />
        </g>
        <g className={clsx(styles.anim, styles.fallback)}>
          <rect x="78" y="16" width="62" height="64" />
          <circle className={styles.spin} cx="109" cy="54" r="8" />
        </g>
      </g>
      {/* the API */}
      <path
        className={styles.api}
        transform="translate(144 38) scale(1.4)"
        d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"
      />
      {/* the request, out the bottom to the API and back over the top */}
      <g className={clsx(styles.anim, styles.chip)}>
        <g className={clsx(styles.anim, styles.request)}>
          <rect x="-13" y="-6" width="26" height="12" rx="6" />
          {/* eslint-disable-next-line @docusaurus/no-untranslated-text -- HTTP method */}
          <text y="2.6">GET</text>
        </g>
        <g className={clsx(styles.anim, styles.response)}>
          <rect x="-13" y="-6" width="26" height="12" rx="6" />
          <rect x="-8" y="-2.5" width="12" height="2" rx="1" />
          <rect x="-8" y="0.8" width="8" height="2" rx="1" />
        </g>
      </g>
    </svg>
  );
}

/** Lines of data, colored by how fresh they are */
function Bars({ x, y, widths }: { x: number; y: number; widths: number[] }) {
  return widths.map((w, i) => (
    <rect
      key={i}
      className={clsx(styles.anim, styles.bar)}
      x={x}
      y={y + i * 11}
      width={w}
      height="6"
    />
  ));
}

interface Tips {
  /** which tooltip a tap pinned open; a tap elsewhere closes it */
  open: number | null;
  setOpen: (i: number | null) => void;
  /** after Escape, until the pointer next enters or presses, or focus lands */
  dismissed: boolean;
  revive: () => void;
}

/** The tooltips' shared state: one pinned at a time, Escape hides them all */
function useTips(): Tips {
  const [open, setOpen] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const pinned = open !== null;
  useEffect(() => {
    if (!pinned) return;
    const close = (e: PointerEvent) => {
      if (!(e.target as Element).closest?.(`.${styles.note}`)) setOpen(null);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [pinned]);
  useEffect(() => {
    const dismiss = (e: KeyboardEvent) => {
      // an Escape another widget already handled is that widget's
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      // focus stays put, except on a link in the tip this hides: it returns
      // to that tip's control, before the dismissal so this focus can't revive it
      const active = document.activeElement;
      if (active?.closest(`.${styles.tip}`))
        active
          .closest(`.${styles.note}`)
          ?.querySelector<HTMLElement>(`.${styles.control}`)
          ?.focus();
      setOpen(null);
      setDismissed(true);
    };
    document.addEventListener('keydown', dismiss);
    return () => document.removeEventListener('keydown', dismiss);
  }, []);
  return { open, setOpen, dismissed, revive: () => setDismissed(false) };
}

interface ControlProps {
  'aria-describedby': string;
  onPointerDown: (e: React.PointerEvent) => void;
}
/** Whether a click came from a tap (keyboard activation never does) */
type Tapped = (e: React.MouseEvent) => boolean;

/**
 * A control explained in a bubble above it on hover, keyboard focus, or a
 * tap; `children` renders the control from the props that wire it up and a
 * check for whether its click was a tap.
 */
function Tip({
  tips,
  index,
  tip,
  href,
  align,
  children,
}: {
  tips: Tips;
  index: number;
  tip: string;
  href: string;
  align: string;
  children: (control: ControlProps, tapped: Tapped) => React.ReactNode;
}) {
  const id = useId();
  const pointerType = useRef<string | null>(null);
  const control: ControlProps = {
    'aria-describedby': id,
    onPointerDown: e => {
      pointerType.current = e.pointerType;
    },
  };
  const tapped: Tapped = e => {
    const touch = e.detail > 0 && pointerType.current === 'touch';
    pointerType.current = null;
    return touch;
  };
  return (
    <span
      className={clsx(
        styles.note,
        align,
        tips.open === index && styles.open,
        tips.dismissed && styles.dismissed,
      )}
      onPointerEnter={tips.revive}
      onPointerDown={tips.revive}
      onFocus={tips.revive}
    >
      {children(control, tapped)}
      <span className={styles.tip} id={id}>
        <span className={styles.bubble}>
          {tip}{' '}
          <a href={href}>
            {translate({
              id: 'expiryTimeline.learnMore',
              message: 'Learn more',
              description:
                'Link in each tooltip of the expiry diagram, to the section explaining that option',
            })}
          </a>
        </span>
      </span>
    </span>
  );
}
