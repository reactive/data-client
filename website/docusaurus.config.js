const path = require('path');

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
      {
        docs: {
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
          path: '../docs',
          lastVersion: '6.1',
          versions: {
            current: { label: '6.2', path: '/next' },
          },
        },
        blog: {
          showReadingTime: true,
        },
        theme: {
          customCss: ['../src/css/customTheme.css', '../src/mocks/init.js'],
        },
        gtag: {
          trackingID: 'UA-138752992-1',
        },
      },
    ],
  ],
  plugins: [
    [
      '@docusaurus/plugin-client-redirects',
      {
        fromExtensions: ['html'],
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
            to: '/docs/api/resource',
            from: ['/docs/guides/resource-types'],
          },
        ],
      },
    ],
    path.resolve(__dirname, './node-plugin'),
  ],
  themeConfig: {
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
          to: 'docs/rest/usage',
          label: 'REST',
          position: 'left',
        },
        {
          to: 'docs/graphql/usage',
          label: 'GraphQL',
          position: 'left',
        },
        { to: '/blog', label: 'News', position: 'left' },
        {
          href: 'https://stackblitz.com/github/coinbase/rest-hooks/tree/master/examples/todo-app?file=src%2Fpages%2FHome%2Findex.tsx',
          label: '🎮 Todo',
          position: 'right',
        },
        {
          href: 'https://stackblitz.com/github/coinbase/rest-hooks/tree/master/examples/github-app?file=src%2Fpages%2FIssueList.tsx',
          label: '🎮 Github',
          position: 'right',
        },
        {
          label: 'Version',
          to: 'docs',
          position: 'right',
          items: [
            {
              label: 'Upgrade Guide',
              to: 'docs/upgrade/upgrading-to-6',
            },
            {
              label: '6.2',
              to: 'docs/next/',
              rel: 'nofollow',
            },
            {
              label: '6.1',
              to: 'docs/',
              activeBaseRegex:
                'docs/(?!2.2|3.0|4.0|4.1|4.2|4.3|4.5|5.0|6.0|6.1|6.2)',
            },
            {
              label: '6.0',
              to: 'docs/6.0/',
              rel: 'nofollow',
            },
            {
              label: '5.0',
              to: 'docs/5.0/',
              rel: 'nofollow',
            },
            {
              label: '4.5',
              to: 'docs/4.5/',
              rel: 'nofollow',
            },
            {
              label: '4.3',
              to: 'docs/4.3/',
              rel: 'nofollow',
            },
            {
              label: '4.2',
              to: 'docs/4.2/',
              rel: 'nofollow',
            },
            {
              label: '4.1',
              to: 'docs/4.1/',
              rel: 'nofollow',
            },
            {
              label: '4.0',
              to: 'docs/4.0/',
              rel: 'nofollow',
            },
            {
              label: '3.0',
              to: 'docs/3.0/',
              rel: 'nofollow',
            },
            {
              label: '2.2',
              to: 'docs/2.2/',
              rel: 'nofollow',
            },
            /*{
              label: 'Master/Unreleased',
              to: 'docs/next/',
              activeBaseRegex: 'docs/next/(?!support|team|resources)',
            },*/
          ],
        },
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
