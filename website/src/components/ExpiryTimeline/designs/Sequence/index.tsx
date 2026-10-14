import { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React, {
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

import styles from './styles.module.css';
import StoreIcon from '../../../Playground/StoreIcon';
import splitAtHeadings from '../../splitAtHeadings';
import base from '../../styles.module.css';

const CASES = ['fresh', 'stale', 'invalid'] as const;
type Case = (typeof CASES)[number];
/** The lifelines, left to right */
type Lane = 0 | 1 | 2;
/** How long an unattended reader sees each case (ms); the longest sequence takes ~3.3s */
const CYCLE = 5200;

interface Arrow {
  from: Lane;
  to: Lane;
  label: string;
  /** a reply, drawn dashed */
  back?: boolean;
}
interface Step {
  /** a message between two lifelines */
  arrow?: Arrow;
  /** what the component shows as a result, on its lifeline */
  chip?: { label: string; tone: Case | 'fallback' };
}

/**
 * A swimlane sequence diagram of what mounting `useSuspense()` does in each
 * expiry state. Tabs pick the state (cycling until the reader picks one), the
 * invalidIfStale switch folds Stale into Invalid, and the page's section for
 * the shown state sits in the tab panel below.
 */
export default function Sequence({ children }: { children?: React.ReactNode }) {
  const id = useId();
  const groups = splitAtHeadings(children);
  const [tab, setTab] = useState<Case>('fresh');
  const [invalidIfStale, setInvalidIfStale] = useState(false);
  const [picked, setPicked] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  // cycle the cases until the reader takes over (or asked for no motion)
  useEffect(() => {
    if (picked || matchMedia('(prefers-reduced-motion: reduce)').matches)
      return;
    const timer = setInterval(
      () => setTab(t => CASES[(CASES.indexOf(t) + 1) % CASES.length]),
      CYCLE,
    );
    return () => clearInterval(timer);
  }, [picked]);

  // a link to a section's heading (#stale) opens its tab
  const anchors = groups.map(group => {
    const heading = group.find(
      (el): el is React.ReactElement<{ id?: string }> =>
        isValidElement<{ id?: string }>(el) && !!el.props.id,
    );
    return heading?.props.id;
  });
  useEffect(() => {
    const follow = () => {
      const i = anchors.indexOf(window.location.hash.slice(1));
      if (i >= 0 && i < CASES.length) {
        setTab(CASES[i]);
        setPicked(true);
      }
    };
    follow();
    window.addEventListener('hashchange', follow);
    return () => window.removeEventListener('hashchange', follow);
    // anchors derive from MDX children, which never change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = (c: Case) => {
    setTab(c);
    setPicked(true);
  };
  const onTabKey = (e: React.KeyboardEvent) => {
    const i = CASES.indexOf(tab);
    const next = {
      ArrowRight: (i + 1) % CASES.length,
      ArrowLeft: (i + CASES.length - 1) % CASES.length,
      Home: 0,
      End: CASES.length - 1,
    }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    pick(CASES[next]);
    const tabs = tabsRef.current?.querySelectorAll<HTMLElement>('[role="tab"]');
    tabs?.[next]?.focus();
  };

  /** the case the diagram and panel show: Stale is Invalid once invalidIfStale is on */
  const shown: Case = tab === 'stale' && invalidIfStale ? 'invalid' : tab;
  const labels: Record<Case, string> = {
    fresh: translate({ id: 'expiryTimeline.fresh', message: 'Fresh' }),
    stale: translate({ id: 'expiryTimeline.stale', message: 'Stale' }),
    invalid: translate({ id: 'expiryTimeline.invalid', message: 'Invalid' }),
  };

  return (
    <div
      className={clsx(base.frame, styles.frame, styles[shown])}
      onPointerDown={() => setPicked(true)}
    >
      <div className={styles.controls}>
        <div
          ref={tabsRef}
          className={styles.tabs}
          role="tablist"
          aria-label={translate({
            id: 'expiryTimeline.sequence.tablist',
            message: 'Expiry status',
            description: 'Label of the Fresh / Stale / Invalid tabs',
          })}
          onKeyDown={onTabKey}
        >
          {CASES.map(c => (
            <button
              key={c}
              type="button"
              role="tab"
              id={`${id}-tab-${c}`}
              aria-selected={c === tab}
              aria-controls={`${id}-panel-${c === tab ? shown : c}`}
              tabIndex={c === tab ? 0 : -1}
              className={clsx(
                styles.tab,
                // Stale is Invalid in all but name
                styles[c === 'stale' && invalidIfStale ? 'invalid' : c],
              )}
              onClick={() => pick(c)}
              onFocus={() => setPicked(true)}
            >
              {labels[c]}
            </button>
          ))}
        </div>
        <Switch
          id={`${id}-switch`}
          checked={invalidIfStale}
          onToggle={() => {
            setInvalidIfStale(v => !v);
            setPicked(true);
          }}
        />
      </div>

      <Diagram key={shown} shown={shown} tab={tab} id={id} />

      {CASES.map((c, i) => (
        <section
          key={c}
          id={`${id}-panel-${c}`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${c === shown ? tab : c}`}
          hidden={c !== shown}
          className={clsx(styles.panel, styles[c])}
        >
          {groups[i]}
        </section>
      ))}
    </div>
  );
}

/** The lifelines and the shown case's messages, drawn in order on mount */
function Diagram({ shown, tab, id }: { shown: Case; tab: Case; id: string }) {
  const t = (message: string, description: string) =>
    translate({
      id: `expiryTimeline.sequence.${message}`,
      message,
      description,
    });
  const read: Arrow = {
    from: 0,
    to: 1,
    label: t('read', 'Component asks store'),
  };
  const get: Arrow = { from: 1, to: 2, label: 'GET' };
  const ok: Arrow = { from: 2, to: 1, label: '200', back: true };
  const update: Arrow = {
    from: 1,
    to: 0,
    label: t('update', 'Store sends new data to component'),
    back: true,
  };
  const render = t('render', 'Component renders');
  const steps: Record<Case, Step[]> = {
    fresh: [
      { arrow: read },
      {
        arrow: {
          from: 1,
          to: 0,
          label: t('hit', 'Store has fresh data'),
          back: true,
        },
        chip: { label: render, tone: 'fresh' },
      },
    ],
    stale: [
      { arrow: read },
      {
        arrow: {
          from: 1,
          to: 0,
          label: t('cached', 'Store has stale data'),
          back: true,
        },
        chip: { label: render, tone: 'stale' },
      },
      { arrow: get },
      { arrow: ok },
      {
        arrow: update,
        chip: {
          label: t('re-render', 'Component renders again'),
          tone: 'fresh',
        },
      },
    ],
    invalid: [
      { arrow: read },
      {
        arrow: {
          from: 1,
          to: 0,
          label: t('miss', 'Store has no usable data'),
          back: true,
        },
        chip: {
          label: t('suspend', 'Component shows its fallback'),
          tone: 'fallback',
        },
      },
      { arrow: get },
      { arrow: ok },
      { arrow: update, chip: { label: render, tone: 'fresh' } },
    ],
  };

  const learnMore = translate({
    id: 'expiryTimeline.learnMore',
    message: 'Learn more',
  });
  const expiry = {
    href: '#endpointdataexpirylength',
    tip: translate({
      id: 'expiryTimeline.sequence.expiryTip',
      message: 'Milliseconds after a response before it is stale.',
      description: 'Tooltip on dataExpiryLength in the expiry sequence diagram',
    }),
  };
  const triggers = {
    fresh: [{ ...expiry, text: '< dataExpiryLength' }],
    stale: [{ ...expiry, text: '> dataExpiryLength' }],
    invalid:
      tab === 'stale' ?
        [
          { ...expiry, text: '> dataExpiryLength' },
          {
            href: '#endpointinvalidifstale',
            text: 'invalidIfStale',
            tip: translate({
              id: 'expiryTimeline.sequence.invalidIfStaleTip',
              message:
                'Stale data is treated as invalid: nothing shows until it refetches.',
              description:
                'Tooltip on invalidIfStale in the expiry sequence diagram',
            }),
          },
        ]
      : [
          {
            href: '#invalidate',
            text: 'ctrl.invalidate()',
            tip: translate({
              id: 'expiryTimeline.sequence.invalidateTip',
              message: 'Marks the data invalid, so it must fetch again.',
              description:
                'Tooltip on ctrl.invalidate() in the expiry sequence diagram',
            }),
          },
        ],
  }[shown];

  return (
    <div className={styles.diagram} aria-hidden="true">
      {[0, 1, 2].map(lane => (
        <span
          key={lane}
          className={clsx(styles.lifeline, styles[`lane${lane}`])}
        />
      ))}
      <div className={styles.lanes}>
        <div className={clsx(styles.head, styles.component)}>
          {t('Component', 'Lifeline of the React component')}
          {/* eslint-disable-next-line @docusaurus/no-untranslated-text -- API name */}
          <code>useSuspense()</code>
        </div>
        <div className={clsx(styles.head, styles.store)}>
          <StoreIcon className={styles.db} />
          {t('Store', 'Lifeline of the normalized store')}
        </div>
        <div className={styles.head}>
          {t('Network', 'Lifeline of the API server')}
        </div>
      </div>
      <div className={styles.triggers}>
        {triggers.map(({ href, text, tip }, i) => (
          <span key={text} className={styles.trigger}>
            <a href={href} aria-describedby={`${id}-trigger-${i}`}>
              {text}
            </a>
            <span
              className={styles.tip}
              id={`${id}-trigger-${i}`}
              role="tooltip"
            >
              <span className={base.bubble}>
                {tip} <a href={href}>{learnMore}</a>
              </span>
            </span>
          </span>
        ))}
      </div>
      <div className={styles.steps}>
        {steps[shown].map(({ arrow, chip }, i) => (
          <div
            key={i}
            className={styles.step}
            style={{ '--i': i } as React.CSSProperties}
          >
            {arrow && (
              <div
                className={clsx(
                  styles.arrow,
                  arrow.to > arrow.from ? styles.right : styles.left,
                  arrow.back && styles.back,
                  chip && styles.toChip,
                )}
                style={{
                  gridColumn: `${2 * Math.min(arrow.from, arrow.to) + 2} / ${2 * Math.max(arrow.from, arrow.to) + 2}`,
                }}
              >
                <span className={styles.label}>{arrow.label}</span>
                <span className={styles.line} />
              </div>
            )}
            {chip && (
              <span className={clsx(styles.chip, styles[chip.tone])}>
                {chip.label}
                {chip.tone === 'fallback' ?
                  <span className={styles.spinner} />
                : <span className={styles.bars} />}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** The invalidIfStale option: on, Stale data suspends like Invalid */
function Switch({
  id,
  checked,
  onToggle,
}: {
  id: string;
  checked: boolean;
  onToggle: () => void;
}) {
  // a finger can't hover, so a tap also shows the explanation
  const pointerType = useRef<string | null>(null);
  const [tapped, setTapped] = useState(false);
  return (
    <span className={clsx(styles.switch, tapped && styles.open)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={`${id}-tip`}
        className={clsx(styles.toggle, checked && styles.on)}
        onPointerDown={e => {
          pointerType.current = e.pointerType;
        }}
        onClick={e => {
          onToggle();
          // keyboard activation (detail 0) is never a tap
          setTapped(e.detail > 0 && pointerType.current === 'touch');
          pointerType.current = null;
        }}
        onBlur={() => setTapped(false)}
      >
        <span className={styles.track}>
          <span className={styles.knob} />
        </span>
        {/* eslint-disable-next-line @docusaurus/no-untranslated-text -- option name */}
        <code>invalidIfStale</code>
      </button>
      <span className={styles.tip} id={`${id}-tip`} role="tooltip">
        <span className={base.bubble}>
          {translate({
            id: 'expiryTimeline.sequence.switchTip',
            message:
              'With invalidIfStale, stale data suspends until it refetches instead of showing.',
            description:
              'Tooltip on the invalidIfStale switch of the expiry sequence diagram',
          })}{' '}
          <a href="#endpointinvalidifstale">
            {translate({
              id: 'expiryTimeline.learnMore',
              message: 'Learn more',
            })}
          </a>
        </span>
      </span>
    </span>
  );
}
