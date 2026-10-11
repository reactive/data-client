// Copied next to an old release's docusaurus.config.ts by build.sh, so the
// archive builds with that release's own config, moved under /<version>/.
// Keep it to fields every release's config has: it runs against old ones.
import config from './docusaurus.config';

const version = process.env.SNAPSHOT_VERSION;
if (!version) throw new Error('SNAPSHOT_VERSION is required');
const { themeConfig = {} } = config;
const navbar = (themeConfig.navbar ?? {}) as { items?: unknown[] };
// Docusaurus loads the config once per locale it builds
const locale = process.env.DOCUSAURUS_CURRENT_LOCALE;
const latestDocs = `${locale && locale !== config.i18n?.defaultLocale ? `/${locale}` : ''}/docs`;

export default {
  ...config,
  baseUrl: `/${version}/`,
  // The latest site's blog has every post; vercel.json and archive.client.ts
  // send /<version>/blog there, so links to it only look broken here. The
  // archive's other links are frozen as released.
  onBrokenLinks: 'ignore',
  clientModules: [
    ...(config.clientModules ?? []),
    require.resolve('./archive.client'),
  ],
  presets: config.presets?.map(preset =>
    Array.isArray(preset) && preset[0] === '@docusaurus/preset-classic' ?
      [preset[0], { ...preset[1], blog: false }]
    : preset,
  ),
  // Redirects to a post would fail the build without the blog
  plugins: config.plugins?.map(plugin =>
    (
      Array.isArray(plugin) &&
      plugin[0] === '@docusaurus/plugin-client-redirects'
    ) ?
      [
        plugin[0],
        {
          ...plugin[1],
          redirects: plugin[1].redirects?.filter(
            ({ to }: { to: string }) => !to.startsWith('/blog'),
          ),
        },
      ]
    : plugin,
  ),
  themeConfig: {
    ...themeConfig,
    // Root-relative links leave the archive for the latest site
    announcementBar: {
      id: `archive-${version}`,
      content: `You're reading the docs for v${version}. <a href="${latestDocs}">See the latest version</a>.`,
      isCloseable: false,
    },
    navbar: {
      ...navbar,
      items: [
        // releases after this one list the archives; the archive links back
        ...(navbar.items ?? []).filter(
          item => (item as { type?: string }).type !== 'custom-versions',
        ),
        // A link, not a dropdown: older releases' CSS hides dropdowns
        {
          // html, not label: a pathname:// href would get an external link icon
          html: `v${version} → Latest`,
          href: `pathname://${latestDocs}`,
          // the latest site is at the root, outside this baseUrl
          autoAddBaseUrl: false,
          target: '_self',
          position: 'right',
        },
      ],
    },
  },
};
