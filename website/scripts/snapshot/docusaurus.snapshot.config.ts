// Copied next to an old release's docusaurus.config.ts by build.sh, so the
// site builds with that release's own config. An archive serves on its own
// host (<version>.dataclient.io); the current version (SNAPSHOT_ROLE=current,
// while master is the next major) stays at the root. Both get the version
// menu by the logo.
// Keep it to fields every release's config has: it runs against old ones.
import config from './docusaurus.config';
import { VERSION_LABEL_ID, versionLabel } from './versionLabel';
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
// every release's config has the production url
const latestDocs = `${config.url}${localePrefix}/docs`;

// Drops the version dropdown some releases have: versionMenu.client.ts opens
// one from the logo, with every version
const navbarItems = (navbar.items ?? []).filter(
  item => (item as { type?: string }).type !== 'custom-versions',
);
// Archives and the current version both label their version, replacing any
// label the release's config has
const headTags = [
  ...(
    (config as { headTags?: { attributes?: { id?: string } }[] }).headTags ?? []
  ).filter(tag => tag.attributes?.id !== VERSION_LABEL_ID),
  versionLabel(`v${version}`),
];

const site =
  isCurrent ? config : (
    {
      ...withoutBlog(config),
      url: `https://${version}.dataclient.io`,
      baseUrl: '/',
    }
  );

// Adds the version menu unless the release's config already has it
const withVersionMenu = (modules: unknown[]) =>
  modules.some(m => /versionMenu\.client/.test(String(m))) ? modules : (
    [...modules, require.resolve('./versionMenu.client')]
  );

export default {
  ...site,
  headTags,
  clientModules: withVersionMenu(site.clientModules ?? []),
  themeConfig: {
    ...themeConfig,
    ...(!isCurrent && {
      announcementBar: {
        id: `archive-${version}`,
        content: `You're reading the docs for v${version}. <a href="${latestDocs}">See the latest version</a>.`,
        isCloseable: false,
      },
    }),
    navbar: { ...navbar, items: navbarItems },
  },
};
