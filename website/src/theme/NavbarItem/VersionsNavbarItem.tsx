import { useLocation } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import type { Props as DropdownProps } from '@theme/NavbarItem/DropdownNavbarItem';
import DropdownNavbarItem from '@theme/NavbarItem/DropdownNavbarItem';
import React, { useCallback, useEffect, useState } from 'react';

import archived from '../../../versionsArchived.json';

const SECTIONS = /^\/(docs|vue|rest|graphql)(\/|$)/;

/**
 * The site is the latest version; this lists the archived ones
 * (scripts/snapshot/README.md), linking to this page in each that has it.
 * Archives are separate builds, so their links load the page, not route.
 */
export default function VersionsNavbarItem(
  props: Omit<DropdownProps, 'items'>,
): React.JSX.Element | null {
  const { pathname } = useLocation();
  const {
    i18n: { currentLocale, defaultLocale },
  } = useDocusaurusContext();
  const [routes, setRoutes] = useState<Record<string, Set<string>>>({});
  // Each archive's sitemaps say which pages it has; read once, when asked
  const loadRoutes = useCallback(() => {
    for (const version of archived) {
      if (version in routes) continue;
      setRoutes(r => ({ ...r, [version]: new Set() }));
      const sitemaps = [
        `/${version}/sitemap.xml`,
        ...(currentLocale === defaultLocale ?
          []
        : [`/${version}/${currentLocale}/sitemap.xml`]),
      ];
      Promise.all(
        sitemaps.map(url =>
          fetch(url)
            .then(res => (res.ok ? res.text() : ''))
            .catch(() => ''),
        ),
      ).then(xmls => {
        const paths = xmls.flatMap(xml =>
          [...xml.matchAll(/<loc>https?:\/\/[^/<]+([^<]*)<\/loc>/g)].map(
            ([, path]) => trimSlash(path),
          ),
        );
        setRoutes(r => ({ ...r, [version]: new Set(paths) }));
      });
    }
  }, [routes, currentLocale, defaultLocale]);
  // The mobile item mounts when the menu opens; the desktop one, with the page
  const { mobile } = props;
  useEffect(() => {
    if (mobile) loadRoutes();
  }, [mobile, loadRoutes]);
  if (!archived.length) return null;

  const page =
    currentLocale === defaultLocale ? pathname : (
      pathname.replace(new RegExp(`^/${currentLocale}(?=/|$)`), '')
    );
  const section = page.match(SECTIONS)?.[1] ?? 'docs';
  const hrefIn = (version: string) => {
    const has = routes[version];
    const candidates = [
      ...(currentLocale === defaultLocale ? [] : [`/${currentLocale}${page}`]),
      page,
      `/${section}`,
    ].map(path => trimSlash(`/${version}${path}`));
    return candidates.find(path => has?.has(path)) ?? candidates.at(-1);
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

const trimSlash = (path: string) => path.replace(/(.)\/$/, '$1');
