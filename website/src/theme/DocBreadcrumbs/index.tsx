import type { WrapperProps } from '@docusaurus/types';
import type DocBreadcrumbsType from '@theme/DocBreadcrumbs';
import DocBreadcrumbs from '@theme-original/DocBreadcrumbs';
import React from 'react';

import styles from './styles.module.css';
import DocsSelector from '../../components/DocsSelector';

type Props = WrapperProps<typeof DocBreadcrumbsType>;

export default function DocBreadcrumbsWrapper(props: Props): React.JSX.Element {
  return (
    <div className={styles.wrapper}>
      <div className={styles.left}>
        <DocBreadcrumbs {...props} />
      </div>
      <DocsSelector />
    </div>
  );
}
