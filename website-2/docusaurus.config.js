/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'Rest Hooks',
  tagline: 'Asynchronous data framework for React',
  url: 'https://resthooks.io',
  baseUrl: '/',
  organizationName: 'coinbase',
  projectName: 'rest-hooks',
  trailingSlash: false,
  scripts: ['https://buttons.github.io/buttons.js'],
  stylesheets: [
    {
      rel: 'preload',
      href: '/font/Graphik-Regular-Web.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
    },
    {
      rel: 'preload',
      href: '/font/Graphik-RegularItalic-Web.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
    },
    {
      rel: 'preload',
      href: '/font/Graphik-Semibold-Web.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
    },
    {
      rel: 'preload',
      href: '/font/Graphik-SemiboldItalic-Web.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
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
    fonts: {
      sansFont: [
        'Graphik',
        'Avenir Next',
        '-apple-system',
        'BlinkMacSystemFont',
        'Segoe UI',
        'Roboto',
        'Oxygen',
        'Ubuntu',
        'Cantarell',
        'Fira Sans',
        'Droid Sans',
        'Helvetica Neue',
        'sans-serif',
      ],
    },
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
          lastVersion: 'current',
          versions: {
            current: { label: '5.0', path: '' },
          },
        },
        blog: {
          showReadingTime: true,
        },
        theme: {
          customCss: '../src/css/customTheme.css',
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
            from: ['/docs/getting-started/loading-state'],
          },
          {
            to: '/docs/concepts/network-errors',
            from: ['/docs/getting-started/network-errors'],
          },
          {
            to: '/docs/getting-started/entity',
            from: ['/docs/getting-started/schema'],
          },
        ],
      },
    ],
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
          to: 'docs/guides/resource-types',
          label: 'REST / CRUD',
          position: 'left',
        },
        { to: '/blog', label: 'News', position: 'left' },
        {
          href: 'https://github.com/coinbase/rest-hooks/tree/master/examples/todo-app',
          label: '🎮 Demo',
          position: 'right',
        },
        {
          label: 'Version',
          to: 'docs',
          position: 'right',
          items: [
            {
              label: '5.0',
              to: 'docs/',
              activeBaseRegex: 'docs/(?!2.2|3.0|4.0|4.1|4.2|4.3|4.5|5.0|next)',
            },
            {
              label: '4.5',
              to: 'docs/4.5/',
            },
            {
              label: '4.3',
              to: 'docs/4.3/',
            },
            {
              label: '4.2',
              to: 'docs/4.2/',
            },
            {
              label: '4.1',
              to: 'docs/4.1/',
            },
            {
              label: '4.0',
              to: 'docs/4.0/',
            },
            {
              label: '3.0',
              to: 'docs/3.0/',
            },
            {
              label: '2.2',
              to: 'docs/2.2/',
            },
            {
              label: 'Master/Unreleased',
              to: 'docs/next/',
              activeBaseRegex: 'docs/next/(?!support|team|resources)',
            },
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
              to: '/docs/guides/resource-types',
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
            {
              html: `<a
              className="github-button"
              href="https://github.com/coinbase/rest-hooks"
              target="_blank"
              data-icon="octicon-star"
              data-count-href="/coinbase/rest-hooks/stargazers"
              data-show-count="true"
              data-count-aria-label="# stargazers on GitHub"
              aria-label="Star this project on GitHub">
              Github
            </a>`,
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Coinbase`,
      logo: {
        src: 'img/rest_hooks_logo.svg',
      },
    },
    algolia: {
      apiKey: '52e661c10738fd114bcf68d537358c16',
      indexName: 'coinbase-rest-hooks',
      contextualSearch: true,
    },
    gtag: {
      trackingID: 'UA-138752992-1',
    },
  },
};
