import { useAllDocsData } from '@docusaurus/plugin-content-docs/client';
import DropdownNavbarItem from '@theme/NavbarItem/DropdownNavbarItem';
import type { Props } from '@theme/NavbarItem/DropdownNavbarItem';
import React from 'react';

import { docsInstance } from '../../../framework-docs/docsInstances.js';
import { usePreferredDocs } from '../../components/useFramework';

/**
 * Menu of docs instances (like React/Vue), labeled with the one being read
 * (else the last one read); the label links to its docs and the options to each
 */
export default function DocsDropdownNavbarItem({
  docsPluginIds,
  ...props
}: Omit<Props, 'items' | 'label'> & {
  docsPluginIds: string[];
}): React.JSX.Element {
  const preferred = usePreferredDocs(docsPluginIds);
  const allDocs = useAllDocsData();
  const docsRoot = (id: string) => allDocs[id].versions[0].path;
  return (
    <DropdownNavbarItem
      {...props}
      label={docsInstance(preferred)!.name}
      to={docsRoot(preferred)}
      items={docsPluginIds.map(id => ({
        label: docsInstance(id)!.name,
        to: docsRoot(id),
        isActive: () => id === preferred,
      }))}
    />
  );
}
