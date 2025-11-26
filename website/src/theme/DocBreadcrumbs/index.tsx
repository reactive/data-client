import React from 'react';
import { useLocation } from '@docusaurus/router';

import DocBreadcrumbs from '@theme-original/DocBreadcrumbs';
import type DocBreadcrumbsType from '@theme/DocBreadcrumbs';
import type { WrapperProps } from '@docusaurus/types';

import FrameworkSelector from '@site/src/components/FrameworkSelector';
import styles from './styles.module.css';

type Props = WrapperProps<typeof DocBreadcrumbsType>;

export default function DocBreadcrumbsWrapper(props: Props): JSX.Element {
  const location = useLocation();
  // Only show framework selector on main /docs pages (not /rest or /graphql)
  const showSelector = location.pathname.startsWith('/docs');

  if (!showSelector) {
    return <DocBreadcrumbs {...props} />;
  }

  return (
    <div className={styles.wrapper} data-framework-selector-anchor>
      <div className={styles.left}>
        <DocBreadcrumbs {...props} />
      </div>
      <div className={styles.right}>
        <FrameworkSelector />
      </div>
    </div>
  );
}

