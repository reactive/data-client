import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from '@docusaurus/router';

import TOC from '@theme-original/TOC';
import type TOCType from '@theme/TOC';
import type { WrapperProps } from '@docusaurus/types';

import FrameworkSelector from '../../components/FrameworkSelector';
import styles from './styles.module.css';

type Props = WrapperProps<typeof TOCType>;

/** Framework selector pinned above the TOC once the breadcrumbs scroll away */
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

    const updatePosition = () => {
      const tocRect = tocElement.getBoundingClientRect();
      setSelectorPosition({
        top: Math.max(tocRect.top, 70), // 70px accounts for navbar height
        right: window.innerWidth - tocRect.right,
      });
    };

    // Show once the breadcrumbs have scrolled out of view
    const observer = new IntersectionObserver(([entry]) => {
      setShowSelector(!entry.isIntersecting);
      if (!entry.isIntersecting) updatePosition();
    });
    observer.observe(breadcrumbsWrapper);
    window.addEventListener('resize', updatePosition, { passive: true });
    updatePosition();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updatePosition);
    };
  }, [isDocsPage, location.pathname]);

  if (!isDocsPage || !selectorPosition) return null;

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

export default function TOCWrapper(props: Props): React.JSX.Element {
  return (
    <>
      <TOC {...props} />
      <FixedFrameworkSelector />
    </>
  );
}
