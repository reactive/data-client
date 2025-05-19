import type * as Preset from '@docusaurus/preset-classic';
import type * as PresetMermaid from '@docusaurus/theme-mermaid';
import type { Config } from '@docusaurus/types';
import path from 'path';
import { themes } from 'prism-react-renderer';

import gqlRedirects from './gqlRedirects';
import versions from './versions.json';

//const versionsRest = require('./rest_versions.json');

const isDev = process.env.NODE_ENV === 'development';

const config: Config = {
  title: 'Data Client',
  tagline: 'Async State Management without the Management',
  url: 'https://dataclient.io',
  baseUrl: '/',
  organizationName: 'data-client',
  projectName: 'data-client',
  trailingSlash: false,
  markdown: {
    mermaid: true,
  },
  headTags: [
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
        crossOrigin: 'anonymous',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://cdn.jsdelivr.net',
        crossOrigin: 'anonymous',
      },
    },
    {
      tagName: 'link',
      attributes: {
        name: 'application-name',
        content: 'Data Client',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'msapplication-TileColor',
        content: '#3e96db',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'msapplication-config',
        content: '/browserconfig.xml',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'theme-color',
        content: '#003a67',
      },
    },
  ],
  stylesheets: [
    {
      rel: 'preload',
      href: 'https://fonts.googleapis.com/css2?family=Rubik:wght@300..900&family=Rubik:ital,wght@1,300..900&family=Roboto+Mono:wght@100..700&family=Roboto+Mono:ital,wght@1,100..700&display=swap',
      as: 'style',
      crossOrigin: true,
    },
    {
      rel: 'preload',
      href: '/css/font.css',
      as: 'style',
      crossOrigin: 'anonymous',
    },
    {
      rel: 'preload',
      href: '/font/Roboto-Mono.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
    },
    {
      rel: 'preload',
      href: '/font/Roboto-Mono-Italic.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
    },
    {
      rel: 'preload',
      href: '/font/Rubik.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
    },
    {
      rel: 'preload',
      href: '/font/Rubik-Italic.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
    },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Rubik:wght@300..900&family=Rubik:ital,wght@1,300..900&family=Roboto+Mono:wght@100..700&family=Roboto+Mono:ital,wght@1,100..700&display=swap',
      crossOrigin: true,
      media: 'all',
    },
    {
      rel: 'stylesheet',
      href: '/css/font.css',
      crossOrigin: 'anonymous',
      media: 'all',
    },
    {
      rel: 'icon',
      href: '/favicon.ico',
      type: 'image/x-icon',
    },
    {
      rel: 'icon',
      type: 'image/png',
      href: '/img/favicon/favicon-16x16.png',
      sizes: '16x16',
    },
    {
      rel: 'icon',
      type: 'image/png',
      href: '/img/favicon/favicon-32x32.png',
      sizes: '32x32',
    },
    {
      rel: 'apple-touch-icon',
      type: 'image/png',
      href: '/apple-touch-icon.png',
      sizes: '180x180',
    },
    {
      rel: 'manifest',
      href: '/img/favicon/site.webmanifest',
    },
    {
      rel: 'mask-icon',
      href: '/img/favicon/safari-pinned-tab.svg',
      color: '#3E96DB',
    },
    /*{
      rel: 'preload',
      href: '/assets/css/root.css',
      as: 'style',
      crossOrigin: true,
    },
    {
      rel: 'stylesheet',
      href: '/assets/css/root.css',
      crossOrigin: true,
      media: 'all',
    }, TODO: figure out how to load this*/
  ],
  scripts: [],
  clientModules: [require.resolve('./src/gtagfix.ts')],
  //favicon: '/favicon.ico', we declare our own headers for this above
  themes: ['@docusaurus/theme-live-codeblock', '@docusaurus/theme-mermaid'],
  customFields: {
    repoUrl: 'https://github.com/reactive/data-client',
  },
  onBrokenLinks: 'log',
  onBrokenMarkdownLinks: 'log',
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          //id: 'core',
          path: '../docs/core',
          exclude: ['getting-started/README.md'],
          //routeBasePath: 'core',
          sidebarPath: require.resolve('./sidebars.json'),
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          editUrl: ({ locale, docPath }) => {
            /*if (locale !== 'en') {
              return `https://crowdin.com/project/docusaurus-v2/${locale}`;
            }*/
            // We want users to submit doc updates to the upstream/next version!
            // Otherwise we risk losing the update on the next release.
            const nextVersionDocsDirPath = 'docs';
            return `https://github.com/reactive/data-client/edit/master/${nextVersionDocsDirPath}/${docPath}`;
          },
          lastVersion: 'current',
          includeCurrentVersion: true,
          versions: {
            current: { label: '0.1', path: '', badge: false },
          },
          onlyIncludeVersions:
            isDev ?
              ['current', ...versions.slice(0, 4)]
            : ['current', ...versions],
        },
        blog: {
          showReadingTime: true,
        },
        theme: {
          customCss: [
            require.resolve('./src/css/root.css'),
            require.resolve('./src/css/customTheme.css'),
          ],
        },
        gtag: {
          trackingID: 'G-1E9TCGX1ZE',
        },
        sitemap: {
          lastmod: 'date',
          priority: null,
          changefreq: null,
        },
      } satisfies Preset.Options,
    ],
  ],
  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'rest',
        path: '../docs/rest',
        routeBasePath: 'rest',
        sidebarPath: require.resolve('./sidebars-rest.js'),
        showLastUpdateAuthor: true,
        showLastUpdateTime: true,
        editUrl: ({ locale, docPath }) => {
          /*if (locale !== 'en') {
            return `https://crowdin.com/project/docusaurus-v2/${locale}`;
          }*/
          // We want users to submit doc updates to the upstream/next version!
          // Otherwise we risk losing the update on the next release.
          const nextVersionDocsDirPath = 'docs/rest';
          return `https://github.com/reactive/data-client/edit/master/${nextVersionDocsDirPath}/${docPath}`;
        },
        lastVersion: 'current',
        includeCurrentVersion: true,
        versions: {
          current: { label: '0.1', path: '', badge: false, banner: 'none' },
        },
        /*onlyIncludeVersions: isDev
          ? ['current', ...versionsRest.slice(0, 4)]
          : ['current', ...versionsRest],*/
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'graphql',
        path: '../docs/graphql',
        routeBasePath: 'graphql',
        sidebarPath: require.resolve('./sidebars-graphql.js'),
        showLastUpdateAuthor: true,
        showLastUpdateTime: true,
        editUrl: ({ locale, docPath }) => {
          /*if (locale !== 'en') {
            return `https://crowdin.com/project/docusaurus-v2/${locale}`;
          }*/
          // We want users to submit doc updates to the upstream/next version!
          // Otherwise we risk losing the update on the next release.
          const nextVersionDocsDirPath = 'docs/graphql';
          return `https://github.com/reactive/data-client/edit/master/${nextVersionDocsDirPath}/${docPath}`;
        },
        lastVersion: 'current',
        includeCurrentVersion: true,
        versions: {
          current: { label: '0.1', path: '', badge: false },
        },
        /*onlyIncludeVersions: isDev
          ? ['current', ...versionsRest.slice(0, 4)]
          : ['current', ...versionsRest],*/
      },
    ],
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          {
            to: '/rest/guides/side-effects',
            from: ['/rest/guides/rpc'],
          },
          {
            to: '/docs/api/ErrorBoundary',
            from: ['/docs/api/NetworkErrorBoundary'],
          },
          {
            to: '/rest/api/resource',
            from: ['/rest/api/createResource', '/rest/api/Resource'],
          },
          {
            to: '/docs/api/makeRenderDataHook',
            from: [
              '/docs/api/makeRenderDataClient',
              '/docs/api/makeExternalCacheProvider',
              '/docs/api/makeCacheProvider',
              '/docs/api/makeRenderRestHook',
            ],
          },
          {
            to: '/rest/guides/partial-entities',
            from: ['/rest/guides/summary-list'],
          },
          {
            to: '/docs/getting-started/resource',
            from: ['/docs/getting-started/endpoint'],
          },
          {
            to: '/docs/api/useQuery',
            from: ['/rest/api/IndexEndpoint'],
          },
          {
            to: '/rest/api/schema',
            from: ['/rest/api/Schema'],
          },
          {
            to: '/blog/2023/07/04/v0.2-release-announcement',
            from: ['/blog/2023/07/04/v8-release-announcement'],
          },
          {
            to: '/docs/api/DataProvider',
            from: ['/docs/api/CacheProvider'],
          },
          {
            to: '/docs/api/ExternalDataProvider',
            from: ['/docs/api/ExternalCacheProvider'],
          },
          {
            to: '/docs/getting-started/debugging',
            from: ['/docs/guides/debugging'],
          },
          {
            to: '/rest/api/EntityMixin',
            from: ['/rest/api/schema.Entity'],
          },
          ...gqlRedirects,
        ],
      },
    ],
    path.resolve(__dirname, './node-plugin'),
    path.resolve(__dirname, './profiling-plugin'),
    path.resolve(__dirname, './raw-plugin'),
  ],
  themeConfig: {
    mermaid: {
      theme: { light: 'neutral', dark: 'dark' },
      options: {
        fontFamily:
          "'Rubik', 'Avenir Next', 'Segoe UI', Tahoma, Geneva,Verdana, sans-serif",
        flowchart: {
          //diagramPadding: 100,
        },
      },
    },
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    prism: {
      additionalLanguages: ['bash', /*'diff', */ 'json'],
      darkTheme: {
        ...themes.palenight,
        plain: { backgroundColor: 'transparent' },
      },
    },
    // Open Graph and Twitter card images.
    image: 'img/social/data-client-logo.png',
    metadata: [
      {
        name: 'twitter:site',
        content: '@dataclientio',
      },
      {
        property: 'og:site_name',
        content: 'Data Client',
      },
      { name: 'twitter:card', content: 'summary' },
    ],
    announcementBar: {
      id: 'announcementBar-2', // Increment on change
      content: `If you like Reactive Data Client, give it a ⭐️ on <a target="_blank" rel="noopener noreferrer" href="https://github.com/reactive/data-client">GitHub</a>`,
    },
    navbar: {
      title: 'Reactive Data Client',
      logo: {
        src: 'img/client-logo.svg',
        alt: 'Reactive Data Client',
        width: '32',
        height: '32',
      },
      hideOnScroll: true,
      items: [
        {
          type: 'doc',
          position: 'left',
          docId: 'introduction',
          label: 'Docs',
        },
        {
          type: 'docSidebar',
          position: 'left',
          sidebarId: 'api',
          label: 'API',
        },
        {
          to: 'rest',
          label: 'REST',
          position: 'left',
        },
        {
          to: 'graphql',
          label: 'GraphQL',
          position: 'left',
        },
        { to: '/blog', label: 'News', position: 'left' },
        /*{
            type: 'docsVersionDropdown',
            docsPluginId: 'default',
            position: 'right',
            dropdownItemsBefore: [
              {
                label: 'Upgrade Guide',
                to: 'docs/upgrade/upgrading-to-7',
              },
            ],/
          },
          {
            type: 'docsVersionDropdown',
            docsPluginId: 'rest',
            position: 'right',
          },
          {
            type: 'docsVersionDropdown',
            docsPluginId: 'graphql',
            position: 'right',
          }, TODO: Add back when we have versions to upgrade*/
        {
          to: 'demos',
          label: 'Demos',
          position: 'left',
          // TODO: move this to right once we get a better image that is more obvious (cube with play triangle inside)
          //className: 'header-demos-link',
          'aria-label': 'Demo Applications',
        },
        {
          href: 'https://github.com/reactive/data-client',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
        },
        {
          href: 'https://discord.gg/9aTc42GXWR',
          position: 'right',
          className: 'header-discord-link',
          'aria-label': 'Discord chat support',
        },
        {
          href: 'https://chatgpt.com/g/g-682609591fe48191a6850901521b4e4b-typescript-rest-codegen',
          position: 'right',
          className: 'header-gpt-link',
          'aria-label': 'Codegeneration with ChatGPT',
        },
      ],
    },
    footer: {
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Introduction',
              to: '/docs',
            },
            {
              label: 'REST',
              to: '/rest',
            },
            {
              label: 'GraphQL',
              to: '/graphql',
            },
            {
              label: 'Images / Binary',
              to: '/docs/guides/img-media',
            },
            {
              label: 'Websockets+SSE',
              to: '/docs/concepts/managers#data-stream',
            },
            {
              label: 'Hooks',
              to: '/docs/api/useSuspense',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Discord',
              href: 'https://discord.gg/35nb8Mz',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/dataclientio',
            },
            {
              label: 'Bug Report',
              href: 'https://github.com/reactive/data-client/issues/new/choose',
            },
            {
              label: 'Ideas',
              href: 'https://github.com/reactive/data-client/discussions/categories/ideas',
            },
            // {
            //   label: 'Stack Overflow',
            //   href: 'http://stackoverflow.com/questions/tagged/data-client',
            // },
            // {
            //   label: 'Showcase',
            //   href: 'https://github.com/reactive/data-client/discussions/2422',
            // }, Don't link until we want to push this
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'Github',
              to: 'https://github.com/reactive/data-client',
            },
            {
              label: 'Demo (Github)',
              to: 'https://stackblitz.com/github/reactive/data-client/tree/master/examples/github-app?file=src%2Fpages%2FIssueList/index.tsx',
            },
            {
              label: 'Demo (Todo)',
              to: 'https://stackblitz.com/github/reactive/data-client/tree/master/examples/todo-app?file=src%2Fpages%2FHome%2FTodoList.tsx',
            },
            {
              label: 'Demo (NextJS)',
              to: 'https://stackblitz.com/github/reactive/data-client/tree/master/examples/nextjs?file=components%2Ftodo%2FTodoList.tsx',
            },
            {
              label: 'NPM',
              to: 'https://www.npmjs.com/package/@data-client/react',
            },
            {
              label: 'Codgen REST APIs',
              to: 'https://chatgpt.com/g/g-682609591fe48191a6850901521b4e4b-typescript-rest-codegen',
            },
            /*{
              html: `<iframe
              src="https://ghbtns.com/github-btn.html?user=reactive&amp;repo=data-client&amp;type=star&amp;count=true&amp;size=small"
              width="110"
              height="19.6"
              title="GitHub Stars"
            />`,
            },*/
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Nathaniel Tucker. Some icons by <a href="https://www.freepik.com" title="Freepik">Freepik</a>`,
      logo: {
        src: 'img/client-logo.svg',
        alt: 'Reactive Data Client',
        width: 94,
        height: 94,
      },
    },
    algolia: {
      appId: 'PCV5G606RI',
      apiKey: 'a36d6d6008f8ac0a20e1ed088be3a8d4',
      indexName: 'dataclient',
      contextualSearch: true,
      searchParameters: {
        /* de-rank blog */
        optionalFilters: ['docusaurus_tag:-default'],
      },
    },
  } satisfies Preset.ThemeConfig & PresetMermaid.ThemeConfig,
};
export default config;
