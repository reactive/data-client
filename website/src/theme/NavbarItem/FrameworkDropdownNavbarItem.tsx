import { useAllDocsData } from '@docusaurus/plugin-content-docs/client';
import DropdownNavbarItem from '@theme/NavbarItem/DropdownNavbarItem';
import type { Props } from '@theme/NavbarItem/DropdownNavbarItem';
import React from 'react';

import { frameworkVariants } from '../../../framework-docs/docsInstances.js';
import { usePreferredFramework } from '../../components/useFramework';

/**
 * Menu of one set of docs in each framework (docsPluginId's, default React/Vue
 * core docs); the label (the reader's framework unless given) links to the
 * reader's framework's docs
 */
export default function FrameworkDropdownNavbarItem({
  docsPluginId = 'default',
  label,
  ...props
}: Omit<Props, 'items' | 'label'> & {
  docsPluginId?: string;
  label?: string;
}): React.JSX.Element {
  const framework = usePreferredFramework();
  const allDocs = useAllDocsData();
  const docsRoot = (id: string) => allDocs[id].versions[0].path;
  const variants = frameworkVariants(docsPluginId);
  const { id, name } = variants.find(d => d.framework === framework)!;
  return (
    <DropdownNavbarItem
      {...props}
      label={label ?? name}
      to={docsRoot(id)}
      items={variants.map(d => ({
        label: d.name,
        to: docsRoot(d.id),
        isActive: () => d.framework === framework,
      }))}
    />
  );
}
