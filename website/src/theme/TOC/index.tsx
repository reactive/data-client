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

/** The desktop TOC, with a header that stays when a wide Playground covers
 * the list: hovering it, or tapping its button, opens the list above it */
export default function TOC({ className, ...props }: Props): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const covered = useCoveredByWideEmbed(ref, contentRef);
  // a tap or click on the button keeps it open; moving the mouse over any
  // visible part opens it until the pointer leaves the card (a pointer
  // parked there as a Playground scrolls in doesn't), and keyboard focus
  // until focus leaves it
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
  useEffect(() => {
    if (covered) return;
    setPinned(false);
    setHovered(false);
    setFocused(false);
  }, [covered]);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setPinned(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [open]);

  const label = translate({
    id: 'theme.TOCCollapsible.toggleButtonLabel',
    message: 'On this page',
  });
  return (
    <div
      ref={ref}
      className={clsx(styles.tableOfContents, 'thin-scrollbar', className)}
      data-covered={covered || undefined}
      data-open={open || undefined}
      onClick={event => {
        if ((event.target as Element).closest('a')) close();
      }}
      onPointerMove={event => {
        if (covered && event.pointerType === 'mouse') setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      onFocus={event => {
        if (event.target.matches(':focus-visible')) setFocused(true);
      }}
      onBlur={event => {
        // a click on the card's text blurs the button but stays inside;
        // focus moving to another element (Tab) leaves
        if (ref.current?.contains(event.relatedTarget)) return;
        setFocused(false);
        if (event.relatedTarget) setPinned(false);
      }}
      onKeyDown={event => {
        if (event.key === 'Escape' && open) close();
      }}
    >
      <button
        type="button"
        className={styles.toggle}
        aria-label={label}
        aria-expanded={open}
        tabIndex={covered ? 0 : -1}
        // a click, tap or Enter closes an open card, whatever opened it
        onClick={() => (open ? close() : setPinned(true))}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M5.5 4h7M5.5 8h7M5.5 12h7" />
          <circle cx="3" cy="4" r=".5" />
          <circle cx="3" cy="8" r=".5" />
          <circle cx="3" cy="12" r=".5" />
        </svg>
      </button>
      <div ref={contentRef} className={styles.content}>
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

/** Whether a wide embed (a row Playground reaching into the TOC column) is
 * under the TOC, and where: `--under-top` and `--under-bottom` on the TOC
 * hold its edges, measured from the TOC's content */
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
    const embeds = document.getElementsByClassName('wide-embed');
    let frame = 0;
    const measure = () => {
      frame = 0;
      if (!embeds.length) return setCovered(false);
      const box = toc.getBoundingClientRect();
      const origin = content.getBoundingClientRect().top;
      let top = Infinity;
      let bottom = -Infinity;
      for (const embed of embeds) {
        const rect = embed.getBoundingClientRect();
        if (rect.right <= box.left || rect.left >= box.right) continue;
        if (rect.bottom <= box.top || rect.top >= box.bottom) continue;
        top = Math.min(top, rect.top - origin);
        bottom = Math.max(bottom, rect.bottom - origin);
      }
      if (top < bottom) {
        toc.style.setProperty('--under-top', `${top}px`);
        toc.style.setProperty('--under-bottom', `${bottom}px`);
      }
      setCovered(top < bottom);
    };
    const schedule = () => {
      frame ||= requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    toc.addEventListener('scroll', schedule, { passive: true });
    // the page's length changes on navigation and as content loads
    const resize = new ResizeObserver(schedule);
    resize.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      toc.removeEventListener('scroll', schedule);
      resize.disconnect();
    };
  }, [ref, contentRef]);
  return covered;
}
