import { useAllDocsData } from '@docusaurus/plugin-content-docs/client';
import DropdownNavbarItem from '@theme/NavbarItem/DropdownNavbarItem';
import type { Props } from '@theme/NavbarItem/DropdownNavbarItem';
import React from 'react';

import {
  FRAMEWORK_INSTANCES,
  frameworkInstance,
} from '../../../framework-docs/docsInstances.js';
import { usePreferredFramework } from '../../components/useFramework';

/**
 * React/Vue menu labeled with the reader's framework; the label links to its
 * docs and the options to each framework's docs
 */
export default function FrameworkDropdownNavbarItem(
  props: Omit<Props, 'items' | 'label'>,
): React.JSX.Element {
  const framework = usePreferredFramework();
  const allDocs = useAllDocsData();
  const docsRoot = (id: string) => allDocs[id].versions[0].path;
  const { id, name } = frameworkInstance(framework)!;
  return (
    <DropdownNavbarItem
      {...props}
      label={name}
      to={docsRoot(id)}
      items={FRAMEWORK_INSTANCES.map(d => ({
        label: d.name,
        to: docsRoot(d.id),
        isActive: () => d.framework === framework,
      }))}
    />
  );
}
