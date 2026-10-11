// Copied next to an old release's docusaurus.config.ts by build.sh, so the
// site builds with that release's own config. An archive moves under
// /<version>/; the current version (SNAPSHOT_ROLE=current, while master is
// the next major) stays at the root and links to /next/.
// Keep it to fields every release's config has: it runs against old ones.
import config from './docusaurus.config';
import withoutBlog from './withoutBlog';

const version = process.env.SNAPSHOT_VERSION;
if (!version) throw new Error('SNAPSHOT_VERSION is required');
const isCurrent = process.env.SNAPSHOT_ROLE === 'current';
const { themeConfig = {} } = config;
const navbar = (themeConfig.navbar ?? {}) as { items?: unknown[] };
// Docusaurus loads the config once per locale it builds ('en' for releases
// without i18n). The latest site serves 'en' (translate/locales.js) at the
// root and other locales under /<locale>/.
const locale = process.env.DOCUSAURUS_CURRENT_LOCALE;
const localePrefix = locale && locale !== 'en' ? `/${locale}` : '';
const latestDocs = `${localePrefix}/docs`;

// An archive drops the version dropdown later releases have, linking to the
// latest docs instead (below). The current version keeps it to list archives.
const navbarItems = (navbar.items ?? []).filter(
  item => isCurrent || (item as { type?: string }).type !== 'custom-versions',
);
// A link, not a dropdown: older releases' CSS hides dropdowns
const navbarLink = (html: string, path: string) => ({
  // html, not label: a pathname:// href would get an external link icon
  html,
  href: `pathname://${path}`,
  // outside this site's baseUrl
  autoAddBaseUrl: false,
  target: '_self',
  position: 'right',
});

const site =
  isCurrent ? config : { ...withoutBlog(config), baseUrl: `/${version}/` };

export default {
  ...site,
  themeConfig: {
    ...themeConfig,
    // Root-relative links leave the archive for the latest site
    ...(!isCurrent && {
      announcementBar: {
        id: `archive-${version}`,
        content: `You're reading the docs for v${version}. <a href="${latestDocs}">See the latest version</a>.`,
        isCloseable: false,
      },
    }),
    navbar: {
      ...navbar,
      items: [
        ...navbarItems,
        isCurrent ?
          navbarLink(`v${version} → Next`, `/next${latestDocs}`)
        : navbarLink(`v${version} → Latest`, latestDocs),
      ],
    },
  },
};
