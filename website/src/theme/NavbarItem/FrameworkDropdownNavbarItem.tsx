import { useAllDocsData } from '@docusaurus/plugin-content-docs/client';
import DropdownNavbarItem from '@theme/NavbarItem/DropdownNavbarItem';
import type { Props } from '@theme/NavbarItem/DropdownNavbarItem';
import React from 'react';

import {
  FRAMEWORK_INSTANCES,
  frameworkInstance,
} from '../../../framework-docs/docsInstances.js';
import { usePreferredFramework } from '../../components/useFramework';

type ItemProps = Omit<Props, 'items' | 'label'>;

/**
 * React/Vue menu labeled with the reader's framework, linking to each
 * framework's docs. Phones keep it in the navbar (customTheme.css), so the
 * side menu gets none.
 */
export default function FrameworkDropdownNavbarItem(
  props: ItemProps,
): React.JSX.Element | null {
  return props.mobile ? null : <FrameworkDropdown {...props} />;
}

function FrameworkDropdown(props: ItemProps): React.JSX.Element {
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
