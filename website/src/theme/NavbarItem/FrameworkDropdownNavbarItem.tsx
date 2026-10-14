import {
  useActiveDocContext,
  useActivePlugin,
  useAllDocsData,
} from '@docusaurus/plugin-content-docs/client';
import { useLocation } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import DropdownNavbarItem from '@theme/NavbarItem/DropdownNavbarItem';
import type { Props } from '@theme/NavbarItem/DropdownNavbarItem';
import clsx from 'clsx';
import React from 'react';

import useFramework, {
  type Framework,
  frameworkOf,
  frameworkPluginId,
  usePreferredFramework,
} from '../../components/useFramework';

const labels: Record<Framework, string> = { react: 'React', vue: 'Vue' };

/** `framework_equivalent:` front matter, both directions (framework-docs/index.js) */
type Equivalents = Record<Framework, Record<string, string>>;

/**
 * Where each framework's option goes: the same page in that framework's docs
 * (the same doc id, or its `framework_equivalent`), else its docs root. The
 * hash only carries over to the same doc.
 */
function useFrameworkLinks(): Record<Framework, string> {
  const allDocs = useAllDocsData();
  const equivalents = useDocusaurusContext().siteConfig.customFields
    ?.frameworkEquivalents as Equivalents;
  const framework = useFramework();
  const { activeDoc } = useActiveDocContext(frameworkPluginId[framework]);
  const { hash } = useLocation();
  const link = (fw: Framework) => {
    const { docs, path } = allDocs[frameworkPluginId[fw]].versions[0];
    const find = (id: string | undefined) =>
      docs.find(doc => doc.id === id)?.path;
    if (!activeDoc) return path;
    const same = find(activeDoc.id);
    return same ?
        same + hash
      : (find(equivalents[framework][activeDoc.id]) ?? path);
  };
  return { react: link('react'), vue: link('vue') };
}

/** React/Vue menu labeled with the reader's framework; picking one opens this page in it */
export default function FrameworkDropdownNavbarItem({
  mobile,
  className,
  ...props
}: Omit<Props, 'items' | 'label'>): React.JSX.Element {
  const framework = usePreferredFramework();
  const links = useFrameworkLinks();
  const inFrameworkDocs = !!frameworkOf(useActivePlugin()?.pluginId);
  return (
    <DropdownNavbarItem
      {...props}
      mobile={mobile}
      className={clsx(
        className,
        !mobile && inFrameworkDocs && 'navbar__link--active',
      )}
      label={labels[framework]}
      items={(Object.keys(labels) as Framework[]).map(fw => ({
        label: labels[fw],
        to: links[fw],
        isActive: () => fw === framework,
      }))}
    />
  );
}
