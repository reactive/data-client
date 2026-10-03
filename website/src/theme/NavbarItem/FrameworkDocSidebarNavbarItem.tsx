import DocSidebarNavbarItem from '@theme/NavbarItem/DocSidebarNavbarItem';
import type { Props } from '@theme/NavbarItem/DocSidebarNavbarItem';
import React from 'react';

import useFramework, { frameworkPluginId } from '../../components/useFramework';

/** `docSidebar` item that links into the current framework's docs (React outside framework docs) */
export default function FrameworkDocSidebarNavbarItem(
  props: Omit<Props, 'docsPluginId'>,
): React.JSX.Element {
  const framework = useFramework();
  return (
    <DocSidebarNavbarItem
      {...props}
      docsPluginId={frameworkPluginId[framework]}
    />
  );
}
