import React from 'react';
import { useLocation } from '@docusaurus/router';

import DocBreadcrumbs from '@theme-original/DocBreadcrumbs';
import type DocBreadcrumbsType from '@theme/DocBreadcrumbs';
import type { WrapperProps } from '@docusaurus/types';

import FrameworkSelector from '../../components/FrameworkSelector';
import styles from './styles.module.css';

type Props = WrapperProps<typeof DocBreadcrumbsType>;

export default function DocBreadcrumbsWrapper(props: Props): React.JSX.Element {
  const { pathname } = useLocation();
  // Only /docs pages have a framework (not /rest or /graphql)
  if (!pathname.startsWith('/docs')) return <DocBreadcrumbs {...props} />;

  return (
    <div className={styles.wrapper}>
      <div className={styles.left}>
        <DocBreadcrumbs {...props} />
      </div>
      <FrameworkSelector />
    </div>
  );
}
