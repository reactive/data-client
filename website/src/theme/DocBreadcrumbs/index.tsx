import { useActivePlugin } from '@docusaurus/plugin-content-docs/client';
import type { WrapperProps } from '@docusaurus/types';
import type DocBreadcrumbsType from '@theme/DocBreadcrumbs';
import DocBreadcrumbs from '@theme-original/DocBreadcrumbs';
import React from 'react';

import styles from './styles.module.css';
import FrameworkSelector from '../../components/FrameworkSelector';
import { frameworkOf } from '../../components/useFramework';

type Props = WrapperProps<typeof DocBreadcrumbsType>;

export default function DocBreadcrumbsWrapper(props: Props): React.JSX.Element {
  // Only framework docs have a selector (not /rest or /graphql)
  if (!frameworkOf(useActivePlugin()?.pluginId))
    return <DocBreadcrumbs {...props} />;

  return (
    <div className={styles.wrapper}>
      <div className={styles.left}>
        <DocBreadcrumbs {...props} />
      </div>
      <FrameworkSelector />
    </div>
  );
}
