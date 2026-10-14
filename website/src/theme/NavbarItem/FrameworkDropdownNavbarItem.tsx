import {
  useActiveDocContext,
  useAllDocsData,
} from '@docusaurus/plugin-content-docs/client';
import { useLocation } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import DropdownNavbarItem from '@theme/NavbarItem/DropdownNavbarItem';
import type { Props } from '@theme/NavbarItem/DropdownNavbarItem';
import React from 'react';

import {
  FRAMEWORK_INSTANCES,
  frameworkInstance,
} from '../../../framework-docs/docsInstances.js';
import {
  type Framework,
  frameworkPluginId,
  useDocsFramework,
  usePreferredFramework,
} from '../../components/useFramework';

/** `framework_equivalent:` front matter, both directions (framework-docs/index.js) */
type Equivalents = Record<Framework, Record<string, string>>;

/**
 * Where each framework's option goes: the same page in that framework's docs
 * (the same doc id, or its `framework_equivalent`), else its docs root. The
 * hash only carries over to the same doc.
 */
function useFrameworkLink(
  current: Framework | undefined,
): (framework: Framework) => string {
  const allDocs = useAllDocsData();
  const equivalents = useDocusaurusContext().siteConfig.customFields
    ?.frameworkEquivalents as Equivalents;
  const { activeDoc } = useActiveDocContext(
    current && frameworkPluginId[current],
  );
  const { hash } = useLocation();
  return (fw: Framework) => {
    const { docs, path } = allDocs[frameworkPluginId[fw]].versions[0];
    const find = (id: string | undefined) =>
      docs.find(doc => doc.id === id)?.path;
    if (!current || !activeDoc) return path;
    const same = find(activeDoc.id);
    return same ?
        same + hash
      : (find(equivalents[current][activeDoc.id]) ?? path);
  };
}

type ItemProps = Omit<Props, 'items' | 'label'>;

/**
 * React/Vue menu labeled with the reader's framework; picking one opens this
 * page in it. Phones keep it in the navbar (customTheme.css), so the side menu
 * gets none.
 */
export default function FrameworkDropdownNavbarItem(
  props: ItemProps,
): React.JSX.Element | null {
  return props.mobile ? null : <FrameworkDropdown {...props} />;
}

function FrameworkDropdown(props: ItemProps): React.JSX.Element {
  const current = useDocsFramework();
  const framework = usePreferredFramework();
  const link = useFrameworkLink(current);
  return (
    <DropdownNavbarItem
      {...props}
      label={frameworkInstance(framework)!.name}
      items={FRAMEWORK_INSTANCES.map(({ framework: fw, name }) => ({
        label: name,
        to: link(fw as Framework),
        isActive: () => fw === framework,
      }))}
    />
  );
}
