import { useLocation } from '@docusaurus/router';
import siteConfig from '@generated/docusaurus.config';
import type { Props as DropdownProps } from '@theme/NavbarItem/DropdownNavbarItem';
import DropdownNavbarItem from '@theme/NavbarItem/DropdownNavbarItem';
import React, { useCallback, useEffect, useState } from 'react';

import {
  DOCS_INSTANCES,
  FRAMEWORK_INSTANCES,
  trimRoute,
} from '../../../framework-docs/docsInstances.js';
import versionsArchived from '../../../versionsArchived.json';

const archived = versionsArchived.map(({ version }) => version);
// '' or this locale build's '/es'
const prefix = siteConfig.baseUrl.slice(0, -1);
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
  const [routes, setRoutes] = useState<Routes>({});
  const loadRoutes = useCallback(() => {
    if (archived.length) fetchRoutes().then(setRoutes);
  }, []);
  // The mobile item mounts when the menu opens; the desktop one, with the page
  const { mobile } = props;
  useEffect(() => {
    if (mobile) loadRoutes();
  }, [mobile, loadRoutes]);
  if (!archived.length) return null;

  const page = pathname.slice(prefix.length);
  // Pages outside the docs (home, blog) go to the default framework's docs
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

type Routes = Record<string, ReadonlySet<string>>;

/** Shared by the desktop and mobile items, so each sitemap loads once */
let routesRequest: Promise<Routes> | undefined;
function fetchRoutes() {
  if (!routesRequest) {
    const request: Promise<Routes> = requestRoutes().catch(() => {
      // a failed load is asked again next time
      if (routesRequest === request) routesRequest = undefined;
      return {};
    });
    routesRequest = request;
  }
  return routesRequest;
}

/** Each archive's pages, from its sitemaps (and this locale's, if it has one) */
async function requestRoutes(): Promise<Routes> {
  const pathsIn = async (url: string) => {
    const res = await fetch(url);
    // an archive without this locale has no sitemap for it
    if (res.status === 404) return [];
    if (!res.ok) throw new Error(`${url}: ${res.status}`);
    const xml = await res.text();
    return [...xml.matchAll(/<loc>https?:\/\/[^/<]+([^<]*)<\/loc>/g)].map(
      ([, path]) => trimRoute(path),
    );
  };
  const entries = await Promise.all(
    archived.map(async version => {
      const sitemaps = [`/${version}/sitemap.xml`];
      if (prefix) sitemaps.push(`/${version}${prefix}/sitemap.xml`);
      const paths = (await Promise.all(sitemaps.map(pathsIn))).flat();
      return [version, new Set(paths)] as const;
    }),
  );
  return Object.fromEntries(entries);
}
