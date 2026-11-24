import { translate } from '@docusaurus/Translate';
import type { Props } from '@theme/TOC';
import TOCItems from '@theme/TOCItems';
import clsx from 'clsx';
import React, { useEffect, useRef, useState } from 'react';

import styles from './styles.module.css';

// Docusaurus's own class names: TOCInline and TOCCollapsible keep theirs, so
// only this list is highlighted while scrolling
const LINK_CLASS_NAME = 'table-of-contents__link toc-highlight';
const LINK_ACTIVE_CLASS_NAME = 'table-of-contents__link--active';

// the contract with blocks that reach into the TOC column (css/customTheme.css)
const WIDE_EMBED = 'wide-embed';
const WIDE_EMBED_PART = 'wide-embed-part';

/** The desktop TOC, with a header that stays when a wide Playground covers
 * the list: hovering it, or tapping its button, opens the list above it */
export default function TOC({ className, ...props }: Props): React.JSX.Element {
  const tocRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const covered = useCoveredByWideEmbed(tocRef, contentRef);
  const { open, toggle, cardProps } = useCard(tocRef, covered);
  const label = translate({
    id: 'theme.TOCCollapsible.toggleButtonLabel',
    message: 'On this page',
  });
  return (
    <div
      ref={tocRef}
      className={clsx(styles.tableOfContents, className)}
      data-covered={covered || undefined}
      // Not data-open: Playground rules match :has([data-open]), so changing
      // that attribute anywhere restyles every playground on the page.
      data-lifted={open || undefined}
      {...cardProps}
    >
      <button
        type="button"
        className={styles.toggle}
        aria-label={label}
        aria-expanded={open}
        tabIndex={covered ? 0 : -1}
        onClick={toggle}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M5.5 4h7M5.5 8h7M5.5 12h7" />
          <circle cx="3" cy="4" r=".5" />
          <circle cx="3" cy="8" r=".5" />
          <circle cx="3" cy="12" r=".5" />
        </svg>
      </button>
      <div ref={contentRef} className={clsx(styles.content, 'thin-scrollbar')}>
        <div className={styles.label}>{label}</div>
        <TOCItems
          {...props}
          linkClassName={LINK_CLASS_NAME}
          linkActiveClassName={LINK_ACTIVE_CLASS_NAME}
        />
      </div>
    </div>
  );
}

/** When the covered TOC opens as a card: a tap or click on its button keeps
 * it open; moving the mouse over any visible part opens it until the pointer
 * leaves the card (a pointer parked there as a Playground scrolls in
 * doesn't), and keyboard focus until focus leaves it. A link, Escape, the
 * button again, or a click outside closes it */
function useCard(ref: React.RefObject<HTMLElement | null>, covered: boolean) {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const open = covered && (pinned || hovered || focused);
  const close = () => {
    setPinned(false);
    setHovered(false);
    setFocused(false);
  };

  // nothing stays pinned for the next Playground once this one has passed
  const [wasCovered, setWasCovered] = useState(covered);
  if (covered !== wasCovered) {
    setWasCovered(covered);
    if (!covered) close();
  }

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setPinned(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [open, ref]);

  const cardProps: React.HTMLAttributes<HTMLElement> = {
    onClick: event => {
      if ((event.target as Element).closest('a')) close();
    },
    onPointerMove: event => {
      if (covered && event.pointerType === 'mouse') setHovered(true);
    },
    onPointerLeave: () => setHovered(false),
    onFocus: event => {
      if (event.target.matches(':focus-visible')) setFocused(true);
    },
    onBlur: event => {
      // a click on the card's text blurs the button but stays inside;
      // focus moving to another element (Tab) leaves
      if (ref.current?.contains(event.relatedTarget)) return;
      setFocused(false);
      if (event.relatedTarget) setPinned(false);
    },
    onKeyDown: event => {
      if (event.key === 'Escape' && open) close();
    },
  };
  // a click, tap or Enter closes an open card, whatever opened it
  const toggle = () => (open ? close() : setPinned(true));
  return { open, toggle, cardProps };
}

/** Whether a wide embed is under the TOC. Where they are is
 * `--under-mask` on the TOC's list, which fades it out beside each one */
function useCoveredByWideEmbed(
  ref: React.RefObject<HTMLElement | null>,
  contentRef: React.RefObject<HTMLElement | null>,
) {
  const [covered, setCovered] = useState(false);
  useEffect(() => {
    const toc = ref.current;
    const content = contentRef.current;
    if (!toc || !content) return;
    // live, so it follows Playgrounds that remount (PlaygroundTabs) and the
    // next doc after a navigation
    const embeds = document.getElementsByClassName(WIDE_EMBED);
    let frame = 0;
    const schedule = () => {
      frame ||= requestAnimationFrame(measure);
    };
    // the page's length changes on navigation and as content loads; a
    // preview can grow (data arriving) beside a taller editor without it
    const resize = new ResizeObserver(schedule);
    resize.observe(document.body);
    const observed = new WeakSet<Element>();
    const observeParts = () => {
      for (const embed of embeds) {
        for (const part of partsOf(embed)) {
          if (observed.has(part)) continue;
          observed.add(part);
          resize.observe(part);
        }
      }
    };
    const measure = () => {
      frame = 0;
      observeParts();
      const bands = embeds.length ? bandsUnder(toc, embeds) : [];
      if (bands.length) {
        const origin = content.getBoundingClientRect().top;
        content.style.setProperty('--under-mask', maskOf(bands, origin));
      }
      setCovered(bands.length > 0);
    };
    measure();

    const listening = new AbortController();
    const { signal } = listening;
    window.addEventListener('scroll', schedule, { passive: true, signal });
    window.addEventListener('resize', schedule, { signal });
    // a click or hover in a wide embed can show a part over the room under
    // its preview (Fixtures), which hides again once it has faded out or a
    // click elsewhere closes it
    const inEmbed = (node: EventTarget | null) =>
      node instanceof Element && node.closest('.' + WIDE_EMBED) !== null;
    const capture = { capture: true, signal };
    document.addEventListener('click', schedule, capture);
    document.addEventListener(
      'pointerover',
      event => {
        if (inEmbed(event.target) || inEmbed(event.relatedTarget)) schedule();
      },
      capture,
    );
    document.addEventListener(
      'transitionend',
      event => {
        if (inEmbed(event.target)) schedule();
      },
      capture,
    );
    return () => {
      cancelAnimationFrame(frame);
      listening.abort();
      resize.disconnect();
    };
  }, [ref, contentRef]);
  return covered;
}

/** What a wide embed draws in the TOC column: its `wide-embed-part`
 * elements, or the whole embed if it marks none */
function partsOf(embed: Element): Iterable<Element> {
  const parts = embed.getElementsByClassName(WIDE_EMBED_PART);
  return parts.length ? parts : [embed];
}

interface Band {
  top: number;
  bottom: number;
}

/** The viewport bands where wide embeds draw over the TOC, top to bottom:
 * only what each draws there (a row Playground's preview, not the empty
 * room under it beside a taller editor), so the TOC shows between two
 * Playgrounds */
function bandsUnder(toc: Element, embeds: HTMLCollectionOf<Element>) {
  const box = toc.getBoundingClientRect();
  const drawn: Band[] = [];
  for (const embed of embeds) {
    for (const part of partsOf(embed)) {
      const rect = part.getBoundingClientRect();
      if (rect.right <= box.left || rect.left >= box.right) continue;
      if (rect.bottom <= box.top || rect.top >= box.bottom) continue;
      // a closed Fixtures popover keeps its box, hidden
      if (!rect.height || getComputedStyle(part).visibility === 'hidden')
        continue;
      drawn.push({ top: rect.top, bottom: rect.bottom });
    }
  }
  return merged(drawn);
}

/** The bands sorted top to bottom, with overlapping ones joined */
function merged(bands: Band[]) {
  const sorted = [...bands].sort((a, b) => a.top - b.top);
  const joined: Band[] = [];
  for (const band of sorted) {
    const last = joined.at(-1);
    if (last && band.top <= last.bottom)
      last.bottom = Math.max(last.bottom, band.bottom);
    else joined.push({ ...band });
  }
  return joined;
}

/** A mask that fades the list out over each band, measured from `origin`,
 * the list's top */
function maskOf(bands: Band[], origin: number) {
  const stops = bands.flatMap(({ top, bottom }) => [
    `#000 calc(${top - origin}px - 1.5rem)`,
    `transparent calc(${top - origin}px - 0.25rem)`,
    `transparent calc(${bottom - origin}px + 0.25rem)`,
    `#000 calc(${bottom - origin}px + 1.5rem)`,
  ]);
  return `linear-gradient(to bottom, ${stops.join(', ')})`;
}
