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
 * React/Vue menu labeled with the reader's framework, linking to each
 * framework's docs
 */
export default function FrameworkDropdownNavbarItem(
  props: Omit<Props, 'items' | 'label'>,
): React.JSX.Element {
  const framework = usePreferredFramework();
  const allDocs = useAllDocsData();
  return (
    <DropdownNavbarItem
      {...props}
      label={frameworkInstance(framework)!.name}
      items={FRAMEWORK_INSTANCES.map(({ id, framework: fw, name }) => ({
        label: name,
        to: allDocs[id].versions[0].path,
        isActive: () => fw === framework,
      }))}
    />
  );
}
