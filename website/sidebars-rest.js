module.exports = {
  docs: [
    {
      type: 'doc',
      id: 'usage',
    },
    {
      type: 'category',
      collapsed: false,
      label: 'Guides',
      items: [
        {
          type: 'doc',
          id: 'guides/url',
        },
        {
          type: 'doc',
          id: 'guides/extending-endpoints',
        },
        {
          type: 'doc',
          id: 'guides/rest-types',
        },
        {
          type: 'doc',
          id: 'guides/pagination',
        },
        {
          type: 'doc',
          id: 'guides/auth',
        },
        {
          type: 'doc',
          id: 'guides/network-transform',
        },
        {
          type: 'doc',
          id: 'guides/mocking-unfinished',
        },
        {
          type: 'doc',
          id: 'guides/nested-response',
        },
        {
          type: 'doc',
          id: 'guides/rpc',
        },
        {
          type: 'doc',
          id: 'guides/computed-properties',
        },
        {
          type: 'doc',
          id: 'guides/custom-networking',
        },
      ],
    },
    {
      type: 'category',
      collapsed: false,
      label: 'API',
      items: [
        {
          type: 'doc',
          id: 'api/resource',
        },
        {
          type: 'doc',
          id: 'api/BaseResource',
        },
        {
          type: 'doc',
          id: 'api/HookableResource',
        },
        {
          type: 'category',
          label: '@rest-hooks/endpoint',
          collapsed: false,
          items: require('./sidebars-endpoint.json'),
        },
      ],
    },
  ],
};
