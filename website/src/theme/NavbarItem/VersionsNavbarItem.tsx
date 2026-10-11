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
// set by docusaurus.config.ts
const { unreleased, others: targets } = siteConfig.customFields!
  .versions as SiteVersions;
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
  // This page in it, else its section start: this locale's, or English's
  // when the version lacks the locale or its pages haven't loaded
  const hrefIn = ({ root }: (typeof targets)[number]) => {
    const paths = routes[root] ?? new Set();
    const candidates = [
      ...(locale ? [`${locale}${page}`] : []),
      page,
      `${locale}/${section}`,
    ].map(trimRoute);
    const path =
      candidates.find(path => paths.has(path)) ?? trimRoute(`/${section}`);
    return `${root}${path}`;
  };

  return (
    <DropdownNavbarItem
      {...props}
      label={unreleased ? 'Next' : 'Latest'}
      onPointerEnter={loadRoutes}
      onFocus={loadRoutes}
      items={targets.map(target => ({
        // html, not label: a pathname:// href gets an external link icon
        html: `v${target.version}`,
        href: `pathname://${hrefIn(target)}`,
        // the others aren't under this baseUrl
        autoAddBaseUrl: false,
        target: '_self',
      }))}
    />
  );
}

/** Each version's pages, keyed by its root, as paths from that root */
type Routes = Record<string, ReadonlySet<string>>;

/** Shared by the desktop and mobile items, so each sitemap loads once */
let routesRequest: Promise<Routes> | undefined;
const fetchRoutes = () => (routesRequest ??= requestRoutes());

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
  // Other origins' sitemaps allow this (vercel.json)
  const results = await Promise.allSettled(
    targets.map(async ({ root }) => {
      const sitemaps = [`${root}/sitemap.xml`];
      if (locale) sitemaps.push(`${root}${locale}/sitemap.xml`);
      const paths = (await Promise.all(sitemaps.map(pathsIn))).flat();
      return [root, new Set(paths)] as const;
    }),
  );
  // one version's failure leaves the others' pages, and is asked again next time
  if (results.some(({ status }) => status === 'rejected'))
    routesRequest = undefined;
  return Object.fromEntries(
    results.flatMap(result =>
      result.status === 'fulfilled' ? [result.value] : [],
    ),
  );
}
