const path = require('path');

const versions = require('./versions.json');
//const versionsRest = require('./rest_versions.json');

const isDev = process.env.NODE_ENV === 'development';

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'Reactive Data Client',
  tagline: 'Async State Management without the Management',
  url: 'https://dataclient.io',
  baseUrl: '/',
  organizationName: 'data-client',
  projectName: 'data-client',
  trailingSlash: false,
  markdown: {
    mermaid: true,
  },
  scripts: [],
  stylesheets: [
    /*{
      rel: 'preload',
      href: '/font/Rubik-VariableFont_wght.ttf',
      as: 'font',
      type: 'font/ttf',
      crossOrigin: 'anonymous',
    },
    {
      rel: 'preload',
      href: '/font/Rubik-Italic-VariableFont_wght.ttf',
      as: 'font',
      type: 'font/ttf',
      crossOrigin: 'anonymous',
    },*/
    {
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossOrigin: true,
    },
    {
      rel: 'preconnect',
      href: 'https://fonts.googleapis.com',
      crossOrigin: true,
    },
    {
      rel: 'preconnect',
      href: 'https://cdn.jsdelivr.net',
      crossOrigin: true,
    },
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
      href: 'https://fonts.gstatic.com/s/rubik/v26/iJWKBXyIfDnIV7nBrXw.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: true,
    },
    {
      rel: 'preload',
      href: 'https://fonts.gstatic.com/s/robotomono/v22/L0x5DF4xlVMF-BfR8bXMIjhLq38.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: true,
    },
    {
      rel: 'preload',
      href: 'https://fonts.gstatic.com/s/rubik/v26/iJWEBXyIfDnIV7nEnX661A.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: true,
    },
    {
      rel: 'preload',
      href: 'https://fonts.gstatic.com/s/robotomono/v22/L0x7DF4xlVMF-BfR8bXMIjhOm32WWg.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: true,
    },
    {
      rel: 'preload',
      href: '/font/Alternox-Semi-Bold.otf',
      as: 'font',
      type: 'font/otf',
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
      href: '/img/favicon/favicon.ico',
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
  clientModules: [require.resolve('./src/gtagfix.ts')],
  //favicon: 'img/favicon/favicon.ico',
  themes: ['@docusaurus/theme-live-codeblock', '@docusaurus/theme-mermaid'],
  customFields: {
    repoUrl: 'https://github.com/reactive/data-client',
  },
  onBrokenLinks: 'log',
  onBrokenMarkdownLinks: 'log',
  presets: [
    [
      '@docusaurus/preset-classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      {
        docs: {
          //id: 'core',
          path: '../docs/core',
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
          onlyIncludeVersions: isDev
            ? ['current', ...versions.slice(0, 4)]
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
      },
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
        redirects: [],
      },
    ],
    path.resolve(__dirname, './node-plugin'),
    path.resolve(__dirname, './profiling-plugin'),
    path.resolve(__dirname, './raw-plugin'),
  ],
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    /** @type {import('@docusaurus/theme-mermaid').ThemeConfig} */
    {
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
      image: 'img/rest_hooks_logo.png',
      // Open Graph and Twitter card images.
      ogImage: 'img/rest_hooks_logo.png',
      twitterImage: 'img/rest_hooks_logo.png',
      announcementBar: {
        id: 'announcementBar-2', // Increment on change
        content: `If you like Reactive Data Client, give it a ⭐️ on <a target="_blank" rel="noopener noreferrer" href="https://github.com/reactive/data-client">GitHub</a>`,
      },
      navbar: {
        title: 'Reactive Data Client',
        logo: {
          src: 'img/client-logo.png',
          alt: 'Reactive Data Client Logo',
          width: '32',
          height: '32',
        },
        hideOnScroll: true,
        items: [
          {
            to: 'docs',
            label: 'Docs',
            position: 'left',
          },
          {
            to: 'docs/api/useSuspense',
            label: 'Hooks',
            position: 'left',
            activeBasePath: '/donotuse',
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
          //{ to: '/blog', label: 'News', position: 'left' }, uncomment once we publish
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
            //label: '🎮 Demos',
            position: 'right',
            className: 'header-demos-link',
            'aria-label': 'Demo Applications',
          },
          {
            href: 'https://www.github.com/reactive/data-client',
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
                to: '/docs/api/Manager#data-stream',
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
                label: 'Stack Overflow',
                href: 'http://stackoverflow.com/questions/tagged/data-client',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/DataClient',
              },
              {
                label: 'Bug Report',
                href: 'https://github.com/reactive/data-client/issues/new/choose',
              },
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
                to: 'https://stackblitz.com/github/reactive/data-client/tree/master/examples/nextjs?file=pages%2FAssetPrice.tsx',
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
          src: 'img/client-logo.png',
          alt: 'Reactive Data Client Logo',
          width: 94,
          height: 90,
        },
      },
      algolia: {
        appId: '09LY5NUEP1',
        apiKey: 'c7ff0e67454c62cecdd72b22a317de43',
        indexName: 'dataclient',
        contextualSearch: true,
        sitemaps: ['https://dataclient.io/sitemap.xml'],
        placeholder: 'Search Reactive Data Client',
        debug: process.env.NODE_ENV === 'development',
      },
    },
};
