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
 * the list: hovering or tapping its button opens the list above it */
export default function TOC({ className, ...props }: Props): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const covered = useCoveredByWideEmbed(ref, contentRef);
  // a tap or click keeps it open; hovering the button opens it until the
  // pointer leaves the card
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const open = covered && (pinned || hovered);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setPinned(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
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
        if (!(event.target as Element).closest('a')) return;
        setPinned(false);
        setHovered(false);
      }}
      onPointerLeave={() => setHovered(false)}
    >
      <button
        type="button"
        className={styles.toggle}
        aria-label={label}
        aria-expanded={open}
        tabIndex={covered ? 0 : -1}
        onClick={() => setPinned(pinned => !pinned)}
        onPointerEnter={event => {
          if (event.pointerType === 'mouse') setHovered(true);
        }}
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
 * hold its edges, measured from the TOC's content, while it scrolls by */
function useCoveredByWideEmbed(
  ref: React.RefObject<HTMLElement | null>,
  contentRef: React.RefObject<HTMLElement | null>,
) {
  const [covered, setCovered] = useState(false);
  useEffect(() => {
    const toc = ref.current;
    const content = contentRef.current;
    const embeds = [
      ...document.querySelectorAll('.theme-doc-markdown .wide-embed'),
    ];
    if (!toc || !content || !embeds.length) return;
    const under = new Set<Element>();
    let frame = 0;
    const measure = () => {
      frame = 0;
      const box = content.getBoundingClientRect();
      let top = Infinity;
      let bottom = -Infinity;
      for (const embed of under) {
        const rect = embed.getBoundingClientRect();
        top = Math.min(top, rect.top - box.top);
        bottom = Math.max(bottom, rect.bottom - box.top);
      }
      toc.style.setProperty('--under-top', `${top}px`);
      toc.style.setProperty('--under-bottom', `${bottom}px`);
    };
    const schedule = () => {
      frame ||= requestAnimationFrame(measure);
    };
    let observer: IntersectionObserver | undefined;
    // the viewport cut down to the TOC's box; the sticky TOC barely moves
    const observe = () => {
      observer?.disconnect();
      under.clear();
      const box = toc.getBoundingClientRect();
      observer = new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            if (entry.isIntersecting) under.add(entry.target);
            else under.delete(entry.target);
          }
          setCovered(under.size > 0);
          if (under.size) {
            measure();
            window.addEventListener('scroll', schedule, { passive: true });
            toc.addEventListener('scroll', schedule, { passive: true });
          } else {
            window.removeEventListener('scroll', schedule);
            toc.removeEventListener('scroll', schedule);
          }
        },
        {
          rootMargin: `${-box.top}px ${box.right - innerWidth}px ${box.bottom - innerHeight}px ${-box.left}px`,
        },
      );
      embeds.forEach(embed => observer?.observe(embed));
    };
    observe();
    const resize = new ResizeObserver(observe);
    resize.observe(toc);
    window.addEventListener('resize', observe);
    return () => {
      observer?.disconnect();
      resize.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', observe);
      window.removeEventListener('scroll', schedule);
      toc.removeEventListener('scroll', schedule);
    };
  }, [ref, contentRef]);
  return covered;
}
