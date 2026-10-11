import { useLocation } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import type { Props as DropdownProps } from '@theme/NavbarItem/DropdownNavbarItem';
import DropdownNavbarItem from '@theme/NavbarItem/DropdownNavbarItem';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
  DOCS_INSTANCES,
  FRAMEWORK_INSTANCES,
  trimRoute,
} from '../../../framework-docs/docsInstances.js';
import archived from '../../../versionsArchived.json';

const SECTION = new RegExp(
  `^/(${DOCS_INSTANCES.map(d => d.routeBasePath).join('|')})(/|$)`,
);

/**
 * The site is the latest version; this lists the archived ones
 * (scripts/snapshot/README.md), linking to this page in each that has it.
 * Archives are separate builds, so their links load the page, not route.
 */
export default function VersionsNavbarItem(
  props: Omit<DropdownProps, 'items'>,
): React.JSX.Element | null {
  const { pathname } = useLocation();
  // '' or this locale's '/es'
  const prefix = useDocusaurusContext().siteConfig.baseUrl.slice(0, -1);
  const [routes, setRoutes] = useState<Record<string, Set<string>>>({});
  const requested = useRef(false);
  // Each archive's sitemaps say which pages it has; read once, when asked
  const loadRoutes = useCallback(() => {
    if (requested.current) return;
    requested.current = true;
    const pathsIn = (url: string) =>
      fetch(url)
        .then(res => (res.ok ? res.text() : ''))
        .catch(() => '')
        .then(xml =>
          [...xml.matchAll(/<loc>https?:\/\/[^/<]+([^<]*)<\/loc>/g)].map(
            ([, path]) => trimRoute(path),
          ),
        );
    Promise.all(
      archived.map(async version => {
        const sitemaps = [`/${version}/sitemap.xml`];
        if (prefix) sitemaps.push(`/${version}${prefix}/sitemap.xml`);
        const paths = (await Promise.all(sitemaps.map(pathsIn))).flat();
        return [version, new Set(paths)] as const;
      }),
    ).then(entries => setRoutes(Object.fromEntries(entries)));
  }, [prefix]);
  // The mobile item mounts when the menu opens; the desktop one, with the page
  const { mobile } = props;
  useEffect(() => {
    if (mobile) loadRoutes();
  }, [mobile, loadRoutes]);
  if (!archived.length) return null;

  const page = pathname.slice(prefix.length);
  const section =
    page.match(SECTION)?.[1] ?? FRAMEWORK_INSTANCES[0].routeBasePath;
  const hrefIn = (version: string) => {
    const candidates = [
      ...(prefix ? [`${prefix}${page}`] : []),
      page,
      `/${section}`,
    ].map(path => trimRoute(`/${version}${path}`));
    return (
      candidates.find(path => routes[version]?.has(path)) ?? candidates.at(-1)
    );
  };

  return (
    <DropdownNavbarItem
      {...props}
      label="Latest"
      onPointerEnter={loadRoutes}
      onFocus={loadRoutes}
      items={archived.map(version => ({
        // html, not label: a pathname:// href gets an external link icon
        html: `v${version}`,
        href: `pathname://${hrefIn(version)}`,
        // the archive is under the site root, not this locale's baseUrl
        autoAddBaseUrl: false,
        target: '_self',
      }))}
    />
  );
}
