import { translate } from '@docusaurus/Translate';
import type { Props } from '@theme/TOC';
import TOCItems from '@theme/TOCItems';
import clsx from 'clsx';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import styles from './styles.module.css';

// Docusaurus's own class names: TOCInline and TOCCollapsible keep theirs, so
// only this list is highlighted while scrolling
const LINK_CLASS_NAME = 'table-of-contents__link toc-highlight';
const LINK_ACTIVE_CLASS_NAME = 'table-of-contents__link--active';

// the contract with blocks that reach into the TOC column (css/customTheme.css)
const WIDE_EMBED = 'wide-embed';
const WIDE_EMBED_PART = 'wide-embed-part';

/** The desktop TOC. Where a wide Playground covers it, it fades out and
 * shows a button beside the Playground: hovering what shows of it, or
 * tapping the button, opens the list above the Playground */
export default function TOC({ className, ...props }: Props): React.JSX.Element {
  const tocRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const covered = useCoveredByWideEmbed(tocRef, contentRef, toggleRef);
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
      // A name of its own: an attribute shared with rules elsewhere would
      // restyle what they match when this toggles (see the Playground
      // README's Design system on :has()).
      data-lifted={open || undefined}
      {...cardProps}
    >
      <button
        ref={toggleRef}
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
 * button again, or a click outside closes it, and the mouse reopens it only
 * once it has left and come back, or beside the next Playground */
function useCard(ref: React.RefObject<HTMLElement | null>, covered: boolean) {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const open = covered && (pinned || hovered || focused);
  const reset = useCallback(() => {
    setPinned(false);
    setHovered(false);
    setFocused(false);
  }, []);
  // set as the reader closes the card, so a pointer still on it doesn't
  // reopen it. A ref: the pointerenter that clears it and the pointermove
  // that reads it come in one task, before React re-renders
  const hoverSpent = useRef(false);
  const close = useCallback(() => {
    hoverSpent.current = true;
    reset();
  }, [reset]);

  // nothing carries over to the next Playground once this one has passed
  const [wasCovered, setWasCovered] = useState(covered);
  if (covered !== wasCovered) {
    setWasCovered(covered);
    if (!covered) reset();
  }
  // after commit, since render can't write a ref
  useEffect(() => {
    if (!covered) hoverSpent.current = false;
  }, [covered]);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setPinned(false);
    };
    // wherever focus is: a card the mouse opened holds none
    const closeOnEscape = (event: KeyboardEvent) => {
      // unless a Playground layer (QuickLook, the drawer) already took it,
      // which it marks with preventDefault(); taking it, so does this
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      close();
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open, ref, close]);

  const cardProps: React.HTMLAttributes<HTMLElement> = {
    onClick: event => {
      if ((event.target as Element).closest('a')) close();
    },
    onPointerMove: event => {
      if (covered && event.pointerType === 'mouse' && !hoverSpent.current)
        setHovered(true);
    },
    // a pointer coming in from outside can open it again
    onPointerEnter: () => {
      hoverSpent.current = false;
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
  };
  // a click, tap or Enter closes an open card, whatever opened it
  const toggle = () => (open ? close() : setPinned(true));
  return { open, toggle, cardProps };
}

/** Whether a wide embed is under the TOC. Where they are is
 * `--under-mask` on the TOC's list, which fades it out beside each one, and
 * the toggle's position: beside the first, where no link shows under it */
function useCoveredByWideEmbed(
  ref: React.RefObject<HTMLElement | null>,
  contentRef: React.RefObject<HTMLElement | null>,
  toggleRef: React.RefObject<HTMLElement | null>,
) {
  const [covered, setCovered] = useState(false);
  useEffect(() => {
    const toc = ref.current;
    const content = contentRef.current;
    const toggle = toggleRef.current;
    if (!toc || !content || !toggle) return;
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
    // the observer holds what it watches, so parts that left the page
    // (another doc, a remount) are let go
    const observed = new Set<Element>();
    const observeParts = () => {
      for (const part of observed) {
        if (part.isConnected) continue;
        observed.delete(part);
        resize.unobserve(part);
      }
      for (const embed of embeds) {
        for (const part of embed.getElementsByClassName(WIDE_EMBED_PART)) {
          if (observed.has(part)) continue;
          observed.add(part);
          resize.observe(part);
        }
      }
    };
    // hovers inside an embed measure often; write only what changed
    let mask = '';
    let offset = '';
    const measure = () => {
      frame = 0;
      observeParts();
      const box = toc.getBoundingClientRect();
      const bands = embeds.length ? bandsUnder(box, embeds) : [];
      if (bands.length) {
        const origin = content.getBoundingClientRect().top;
        const nextMask = maskOf(bands, origin);
        if (nextMask !== mask) {
          mask = nextMask;
          content.style.setProperty('--under-mask', mask);
        }
        const nextOffset = `0 ${toggleOffset(box, toc, toggle, bands[0])}px`;
        if (nextOffset !== offset) {
          offset = nextOffset;
          toggle.style.translate = offset;
        }
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
  }, [ref, contentRef, toggleRef]);
  return covered;
}

interface Band {
  top: number;
  bottom: number;
}

/** The viewport bands where wide embeds draw over the TOC's `box`, top to
 * bottom: only what each draws there, its `wide-embed-part` elements (a row
 * Playground's preview, not the empty room under it beside a taller
 * editor), so the TOC shows between two Playgrounds */
function bandsUnder(box: DOMRect, embeds: HTMLCollectionOf<Element>) {
  const drawn: Band[] = [];
  for (const embed of embeds) {
    // one read for an embed that doesn't reach (narrow screens)
    if (!overlaps(embed.getBoundingClientRect(), box)) continue;
    for (const part of embed.getElementsByClassName(WIDE_EMBED_PART)) {
      const rect = part.getBoundingClientRect();
      if (!overlaps(rect, box)) continue;
      // a closed Fixtures popover keeps its box, hidden
      if (!rect.height || getComputedStyle(part).visibility === 'hidden')
        continue;
      drawn.push({ top: rect.top, bottom: rect.bottom });
    }
  }
  return merged(drawn);
}

function overlaps(a: DOMRect, b: DOMRect) {
  return (
    a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom
  );
}

/** The bands sorted top to bottom, with overlapping ones joined */
function merged(bands: Band[]) {
  const joined: Band[] = [];
  for (const band of bands.sort((a, b) => a.top - b.top)) {
    const last = joined.at(-1);
    if (last && band.top <= last.bottom)
      last.bottom = Math.max(last.bottom, band.bottom);
    else joined.push({ ...band });
  }
  return joined;
}

/** How far below its place at the TOC's top the toggle goes to sit at the
 * band's top, kept inside the TOC */
function toggleOffset(
  box: DOMRect,
  toc: HTMLElement,
  toggle: HTMLElement,
  band: Band,
) {
  const room = toc.clientHeight - toggle.offsetHeight - 2 * toggle.offsetTop;
  return Math.min(Math.max(band.top - box.top - toggle.offsetTop, 0), room);
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
