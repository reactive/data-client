import { useLocation } from '@docusaurus/router';
import siteConfig from '@generated/docusaurus.config';
import i18n from '@generated/i18n';
import type { Props as DropdownProps } from '@theme/NavbarItem/DropdownNavbarItem';
import DropdownNavbarItem from '@theme/NavbarItem/DropdownNavbarItem';
import React, { useCallback, useEffect, useState } from 'react';

import {
  DOCS_INSTANCES,
  FRAMEWORK_INSTANCES,
  trimRoute,
} from '../../../framework-docs/docsInstances.js';
import versionsArchived from '../../../versionsArchived.json';

const { baseUrl } = siteConfig;
// Where each version lives: '' for the site root, else '/<version>'. While
// master is the next major, the current version's site is the root.
const current = siteConfig.customFields?.versionCurrent as string | null;
const targets = [
  ...(current ? [{ version: current, root: '' }] : []),
  ...versionsArchived.map(({ version }) => ({ version, root: `/${version}` })),
];
// '' or this locale build's '/es'
const locale =
  i18n.currentLocale === i18n.defaultLocale ? '' : `/${i18n.currentLocale}`;
const SECTION = new RegExp(
  `^/(${DOCS_INSTANCES.map(d => d.routeBasePath).join('|')})(/|$)`,
);

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
  const [routes, setRoutes] = useState<Routes>({});
  const loadRoutes = useCallback(() => {
    if (targets.length) fetchRoutes().then(setRoutes);
  }, []);
  // The mobile item mounts when the menu opens; the desktop one, with the page
  const { mobile } = props;
  useEffect(() => {
    if (mobile) loadRoutes();
  }, [mobile, loadRoutes]);
  if (!targets.length) return null;

  const page = pathname.slice(baseUrl.length - 1);
  // Pages outside the docs (home, blog) go to the default framework's docs
  const section =
    page.match(SECTION)?.[1] ?? FRAMEWORK_INSTANCES[0].routeBasePath;
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
      label={current ? 'Next' : 'Latest'}
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
    targets.map(async ({ root }) => {
      const sitemaps = [`${root}/sitemap.xml`];
      if (locale) sitemaps.push(`${root}${locale}/sitemap.xml`);
      const paths = (await Promise.all(sitemaps.map(pathsIn))).flat();
      return [root, new Set(paths)] as const;
    }),
  );
  return Object.fromEntries(entries);
}
