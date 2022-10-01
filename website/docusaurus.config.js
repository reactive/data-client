const path = require('path');

const versions = require('./versions.json');
//const versionsRest = require('./rest_versions.json');

const isDev = process.env.NODE_ENV === 'development';

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'Rest Hooks',
  tagline: 'Asynchronous data framework for React',
  url: 'https://resthooks.io',
  baseUrl: '/',
  organizationName: 'coinbase',
  projectName: 'rest-hooks',
  trailingSlash: false,
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
      rel: 'preload',
      href: 'https://fonts.googleapis.com/css2?family=Rubik:wght@300..900&family=Rubik:ital,wght@1,300..900&family=Roboto+Mono:wght@100..700&family=Roboto+Mono:ital,wght@1,100..700&display=swap',
      as: 'style',
      crossOrigin: true,
    },
  ],
  favicon: 'img/favicon/favicon.ico',
  themes: ['@docusaurus/theme-live-codeblock'],
  customFields: {
    users: [
      {
        caption: 'Coinbase',
        image: '/img/coinbase-logo.svg',
        infoLink: 'https://www.coinbase.com',
        pinned: true,
      },
    ],
    repoUrl: 'https://github.com/coinbase/rest-hooks',
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
            return `https://github.com/coinbase/rest-hooks/edit/master/${nextVersionDocsDirPath}/${docPath}`;
          },
          lastVersion: 'current',
          includeCurrentVersion: true,
          versions: {
            current: { label: '6.4', path: '', badge: false },
            '5.0': { label: '5.0', path: '5.0', banner: 'none' },
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
            require.resolve('./src/css/customTheme.css'),
            require.resolve('./src/mocks/init.js'),
          ],
        },
        gtag: {
          trackingID: 'UA-138752992-1',
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
          return `https://github.com/coinbase/rest-hooks/edit/master/${nextVersionDocsDirPath}/${docPath}`;
        },
        lastVersion: 'current',
        includeCurrentVersion: true,
        versions: {
          current: { label: '6.0', path: '', badge: false, banner: 'none' },
          5.2: { label: '5.2', path: '5.2', banner: 'none' },
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
          return `https://github.com/coinbase/rest-hooks/edit/master/${nextVersionDocsDirPath}/${docPath}`;
        },
        lastVersion: 'current',
        includeCurrentVersion: true,
        versions: {
          current: { label: '0.3', path: '', badge: false },
        },
        /*onlyIncludeVersions: isDev
          ? ['current', ...versionsRest.slice(0, 4)]
          : ['current', ...versionsRest],*/
      },
    ],
    [
      '@docusaurus/plugin-client-redirects',
      {
        createRedirects(existingPath) {
          if (existingPath.includes('/rest')) {
            return [
              existingPath.replace('/rest', '/docs/rest'),
              existingPath.replace('/rest', '/docs'),
            ];
          } else if (existingPath.includes('/graphql')) {
            return [existingPath.replace('/graphql', '/docs/graphql')];
          }
          return undefined;
        },
        redirects: [
          {
            to: '/docs/',
            from: [
              '/docs/getting-started/introduction',
              '/docs/getting-started/usage',
            ],
          },
          {
            to: '/docs/concepts/loading-state',
            from: ['/docs/guides/loading-state'],
          },
          {
            to: '/docs/concepts/network-errors',
            from: ['/docs/guides/network-errors'],
          },
          {
            to: '/docs/getting-started/entity',
            from: ['/docs/getting-started/schema'],
          },
          {
            to: '/docs/api/types',
            from: ['/docs/api/README'],
          },
          {
            to: '/docs/guides/img-media',
            from: ['/docs/guides/binary-fetches'],
          },
          {
            to: '/rest/api/createResource',
            from: [
              '/rest/api/resource',
              '/rest/api/BaseResource',
              '/docs/guides/resource-types',
            ],
          },
          {
            to: '/rest/api/RestEndpoint',
            from: ['/rest/guides/extending-endpoints'],
          },
          {
            to: '/rest/api/hookifyResource',
            from: ['/rest/api/HookableResource'],
          },
          {
            to: '/docs/api/useSuspense',
            from: ['/docs/next/api/useSuspense'],
          },
          {
            to: '/docs/api/useDLE',
            from: ['/docs/guides/no-suspense'],
          },
          {
            to: '/docs/getting-started/expiry-policy',
            from: ['/docs/guides/resource-lifetime'],
          },
          {
            to: '/rest/guides/pagination',
            from: ['/docs/guides/infinite-scrolling-pagination'],
          },
        ],
      },
    ],
    path.resolve(__dirname, './node-plugin'),
  ],
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    {
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
        content: `If you like Rest Hooks, give it a ⭐️ on <a target="_blank" rel="noopener noreferrer" href="https://github.com/coinbase/rest-hooks">GitHub</a>`,
      },
      navbar: {
        title: 'Rest Hooks',
        logo: {
          src: 'img/rest_hooks_logo.svg',
        },
        hideOnScroll: true,
        items: [
          {
            to: 'docs',
            label: 'Docs',
            position: 'left',
          },
          {
            to: 'docs/api/types',
            label: 'API',
            position: 'left',
          },
          {
            to: 'rest/usage',
            label: 'REST',
            position: 'left',
          },
          {
            to: 'graphql/usage',
            label: 'GraphQL',
            position: 'left',
          },
          { to: '/blog', label: 'News', position: 'left' },
          {
            to: 'demos',
            label: '🎮 Demos',
            position: 'right',
          },
          {
            type: 'docsVersionDropdown',
            docsPluginId: 'default',
            position: 'right',
            dropdownItemsBefore: [
              {
                label: 'Upgrade Guide',
                to: 'docs/upgrade/upgrading-to-6',
              },
            ],
          },
          {
            type: 'docsVersionDropdown',
            docsPluginId: 'rest',
            position: 'right',
          },
          /*{
          label: 'Version',
          to: 'docs',
          position: 'right',
          items: [
            {
              label: 'Upgrade Guide',
              to: 'docs/upgrade/upgrading-to-6',
            },
            {
              label: '6.3',
              to: 'docs/',
              activeBaseRegex:
                'docs/(?!2.2|3.0|4.0|4.1|4.2|4.3|4.5|5.0|6.0|6.1|6.2|6.3)',
            },
            ...versions.map(version => ({
              label: version,
              to: `docs/${version}`,
              rel: 'nofollow',
            })),
            /*{
              label: 'Master/Unreleased',
              to: 'docs/next/',
              activeBaseRegex: 'docs/next/(?!support|team|resources)',
            },*
          ],
        },*/
          {
            href: 'https://www.github.com/coinbase/rest-hooks',
            position: 'right',
            className: 'header-github-link',
            'aria-label': 'GitHub repository',
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
                label: 'REST / CRUD',
                to: '/docs/rest/usage',
              },
              {
                label: 'GraphQL',
                to: '/docs/graphql/usage',
              },
              {
                label: 'API',
                to: '/docs/api/types',
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
                href: 'http://stackoverflow.com/questions/tagged/rest-hooks',
              },
              /*{
              label: 'Twitter',
              href: 'https://twitter.com/RestHooks',
            },*/
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Blog',
                to: '/blog',
              },
              /*{
              html: `<iframe
              src="https://ghbtns.com/github-btn.html?user=coinbase&amp;repo=rest-hooks&amp;type=star&amp;count=true&amp;size=small"
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
          src: 'img/rest_hooks_logo.svg',
        },
      },
      algolia: {
        appId: 'BH4D9OD16A',
        apiKey: '937e8e00950173761eede8a9c5ed77ac',
        indexName: 'resthooks',
        contextualSearch: true,
        algoliaOptions: {
          debug: process.env.NODE_ENV === 'development',
          facetFilters: ['docusaurus_tag:docs-default-current'],
        },
      },
    },
};
