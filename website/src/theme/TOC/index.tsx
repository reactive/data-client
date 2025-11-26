import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from '@docusaurus/router';

import TOC from '@theme-original/TOC';
import type TOCType from '@theme/TOC';
import type { WrapperProps } from '@docusaurus/types';

import FrameworkSelector from '@site/src/components/FrameworkSelector';
import styles from './styles.module.css';

type Props = WrapperProps<typeof TOCType>;

// Separate component for the fixed selector to avoid any wrapper interference
function FixedFrameworkSelector() {
  const [showSelector, setShowSelector] = useState(false);
  const [selectorPosition, setSelectorPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);
  const location = useLocation();

  // Only show on main /docs pages (not /rest or /graphql)
  const isDocsPage = location.pathname.startsWith('/docs');

  useEffect(() => {
    if (!isDocsPage) return;

    const breadcrumbsWrapper = document.querySelector(
      '[data-framework-selector-anchor]',
    );
    const tocElement = document.querySelector('.theme-doc-toc-desktop');

    if (!breadcrumbsWrapper || !tocElement) return;

    // Update position based on TOC element (only needed on resize)
    const updatePosition = () => {
      const tocRect = tocElement.getBoundingClientRect();
      setSelectorPosition({
        top: Math.max(tocRect.top, 70), // 70px accounts for navbar height
        right: window.innerWidth - tocRect.right,
      });
    };

    // Use IntersectionObserver - much more efficient than scroll events
    // Only fires when visibility state changes, not on every scroll frame
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show selector when breadcrumbs are NOT intersecting (scrolled out of view)
        const shouldShow = !entry.isIntersecting;
        setShowSelector(shouldShow);
        if (shouldShow) {
          updatePosition();
        }
      },
      {
        // Trigger when element fully leaves the viewport (top edge)
        threshold: 0,
        rootMargin: '0px',
      },
    );

    observer.observe(breadcrumbsWrapper);

    // Only need resize listener for position updates (not scroll)
    window.addEventListener('resize', updatePosition, { passive: true });

    // Initial position calculation
    updatePosition();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updatePosition);
    };
  }, [isDocsPage, location.pathname]);

  if (!isDocsPage || !selectorPosition) return null;

  // Use portal to render outside the TOC hierarchy
  return createPortal(
    <div
      className={`${styles.fixedSelector} ${showSelector ? styles.visible : ''}`}
      style={{
        top: selectorPosition.top,
        right: selectorPosition.right,
      }}
    >
      <FrameworkSelector />
    </div>,
    document.body,
  );
}

export default function TOCWrapper(props: Props): JSX.Element {
  return (
    <>
      <TOC {...props} />
      <FixedFrameworkSelector />
    </>
  );
}

