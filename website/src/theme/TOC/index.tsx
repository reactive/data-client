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
      className={clsx(styles.tableOfContents, className)}
      data-covered={covered || undefined}
      // Not data-open: Playground rules match :has([data-open]), so changing
      // that attribute anywhere restyles every playground on the page.
      data-lifted={open || undefined}
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

/** Whether a wide embed (a row Playground reaching into the TOC column) is
 * under the TOC, and where: `--under-top` and `--under-bottom` on the TOC's
 * list hold its edges, measured from the list's top */
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
        // only what it draws there: a row Playground's preview, not the
        // empty room under it beside a taller editor
        const parts = embed.getElementsByClassName('wide-embed-part');
        for (const part of parts.length ? parts : [embed]) {
          const rect = part.getBoundingClientRect();
          if (rect.right <= box.left || rect.left >= box.right) continue;
          if (rect.bottom <= box.top || rect.top >= box.bottom) continue;
          // a closed Fixtures popover keeps its box, hidden
          if (!rect.height || getComputedStyle(part).visibility === 'hidden')
            continue;
          top = Math.min(top, rect.top - origin);
          bottom = Math.max(bottom, rect.bottom - origin);
        }
      }
      if (top < bottom) {
        content.style.setProperty('--under-top', `${top}px`);
        content.style.setProperty('--under-bottom', `${bottom}px`);
      }
      setCovered(top < bottom);
    };
    const schedule = () => {
      frame ||= requestAnimationFrame(measure);
    };
    measure();
    // a click or hover in a wide embed can show a part over the room under
    // its preview (Fixtures), which hides again once it has faded out or a
    // click elsewhere closes it
    const inEmbed = (node: EventTarget | null) =>
      node instanceof Element && node.closest('.wide-embed') !== null;
    const onPointerOver = (event: PointerEvent) => {
      if (inEmbed(event.target) || inEmbed(event.relatedTarget)) schedule();
    };
    const onTransitionEnd = (event: TransitionEvent) => {
      if (inEmbed(event.target)) schedule();
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    document.addEventListener('click', schedule, true);
    document.addEventListener('pointerover', onPointerOver, true);
    document.addEventListener('transitionend', onTransitionEnd, true);
    // the page's length changes on navigation and as content loads
    const resize = new ResizeObserver(schedule);
    resize.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('click', schedule, true);
      document.removeEventListener('pointerover', onPointerOver, true);
      document.removeEventListener('transitionend', onTransitionEnd, true);
      resize.disconnect();
    };
  }, [ref, contentRef]);
  return covered;
}
