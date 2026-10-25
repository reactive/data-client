import DocSidebarNavbarItem from '@theme/NavbarItem/DocSidebarNavbarItem';
import type { Props } from '@theme/NavbarItem/DocSidebarNavbarItem';
import React from 'react';

import { usePreferredDocs } from '../../components/useFramework';

/** `docSidebar` item linking into the docs instance being read (else the last one read) of docsPluginIds */
export default function PreferredDocSidebarNavbarItem({
  docsPluginIds,
  ...props
}: Omit<Props, 'docsPluginId'> & {
  docsPluginIds: string[];
}): React.JSX.Element {
  return (
    <DocSidebarNavbarItem
      {...props}
      docsPluginId={usePreferredDocs(docsPluginIds)}
    />
  );
}
