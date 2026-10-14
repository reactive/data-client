import DocSidebarNavbarItem from '@theme/NavbarItem/DocSidebarNavbarItem';
import type { Props } from '@theme/NavbarItem/DocSidebarNavbarItem';
import React from 'react';

import {
  frameworkPluginId,
  usePreferredFramework,
} from '../../components/useFramework';

/** `docSidebar` item that links into the current framework's docs (the last one viewed outside framework docs) */
export default function FrameworkDocSidebarNavbarItem(
  props: Omit<Props, 'docsPluginId'>,
): React.JSX.Element {
  const framework = usePreferredFramework();
  return (
    <DocSidebarNavbarItem
      {...props}
      docsPluginId={frameworkPluginId[framework]}
    />
  );
}
