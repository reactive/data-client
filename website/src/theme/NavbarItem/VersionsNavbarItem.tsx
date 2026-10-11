import { useActivePlugin } from '@docusaurus/plugin-content-docs/client';
import { useLocation } from '@docusaurus/router';
import siteConfig from '@generated/docusaurus.config';
import i18n from '@generated/i18n';
import type { Props as DropdownProps } from '@theme/NavbarItem/DropdownNavbarItem';
import DropdownNavbarItem from '@theme/NavbarItem/DropdownNavbarItem';
import React, { useCallback, useEffect, useState } from 'react';

import {
  FRAMEWORK_INSTANCES,
  docsInstance,
  trimRoute,
} from '../../../framework-docs/docsInstances.js';
import type { SiteVersions } from '../../../siteVersions';

const { baseUrl } = siteConfig;
const { next, others: targets } = siteConfig.customFields
  ?.versions as SiteVersions;
// '' or this locale build's '/es'
const locale =
  i18n.currentLocale === i18n.defaultLocale ? '' : `/${i18n.currentLocale}`;

/**
 * The site is the latest version (or the next one while master is a major
 * ahead); this lists the others (scripts/snapshot/README.md), linking to this
 * page in each that has it. They are separate builds, so their links load the
 * page, not route.
 */
export default function VersionsNavbarItem(
  props: Omit<DropdownProps, 'items'>,
): React.JSX.Element | null {
  const { pathname } = useLocation();
  const pluginId = useActivePlugin()?.pluginId;
  // Pages outside the docs (home, blog) go to the default framework's docs
  const section = (docsInstance(pluginId) ?? FRAMEWORK_INSTANCES[0])
    .routeBasePath;
  const [routes, setRoutes] = useState<Routes>({});
  const loadRoutes = useCallback(() => {
    fetchRoutes().then(setRoutes);
  }, []);
  // The mobile item mounts when the menu opens; the desktop one, with the page
  const { mobile } = props;
  useEffect(() => {
    if (mobile) loadRoutes();
  }, [mobile, loadRoutes]);
  if (!targets.length) return null;

  const page = pathname.slice(baseUrl.length - 1);
  const hrefIn = ({ root }: (typeof targets)[number]) => {
    const candidates = [
      ...(locale ? [`${locale}${page}`] : []),
      page,
      `/${section}`,
    ].map(path => trimRoute(`${root}${path}`));
    return (
      candidates.find(path => routes[root]?.has(path)) ?? candidates.at(-1)
    );
  };

  return (
    <DropdownNavbarItem
      {...props}
      label={next ? 'Next' : 'Latest'}
      onPointerEnter={loadRoutes}
      onFocus={loadRoutes}
      items={targets.map(target => ({
        // html, not label: a pathname:// href gets an external link icon
        html: `v${target.version}`,
        href: `pathname://${hrefIn(target)}`,
        // the others are under the site root, not this baseUrl
        autoAddBaseUrl: false,
        target: '_self',
      }))}
    />
  );
}

/** Each version's pages, keyed by its root */
type Routes = Record<string, ReadonlySet<string>>;

/** Shared by the desktop and mobile items, so each sitemap loads once */
let routesRequest: Promise<Routes> | undefined;
const fetchRoutes = () =>
  (routesRequest ??= requestRoutes().catch(() => {
    // a failed load is asked again next time
    routesRequest = undefined;
    return {};
  }));

/** Each version's pages, from its sitemaps (and this locale's, if it has one) */
async function requestRoutes(): Promise<Routes> {
  const pathsIn = async (url: string) => {
    const res = await fetch(url);
    // a version without this locale has no sitemap for it
    if (res.status === 404) return [];
    if (!res.ok) throw new Error(`${url}: ${res.status}`);
    const xml = await res.text();
    return [...xml.matchAll(/<loc>https?:\/\/[^/<]+([^<]*)<\/loc>/g)].map(
      ([, path]) => trimRoute(path),
    );
  };
  const entries = await Promise.all(
    // another origin's (production's, from a preview) can't be read
    targets
      .filter(({ root }) => !root.includes('://'))
      .map(async ({ root }) => {
        const sitemaps = [`${root}/sitemap.xml`];
        if (locale) sitemaps.push(`${root}${locale}/sitemap.xml`);
        const paths = (await Promise.all(sitemaps.map(pathsIn))).flat();
        return [root, new Set(paths)] as const;
      }),
  );
  return Object.fromEntries(entries);
}
