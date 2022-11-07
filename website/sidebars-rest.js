module.exports = {
  docs: [
    {
      type: 'doc',
      id: 'README',
    },
    {
      type: 'category',
      collapsed: false,
      label: 'Networking Guides',
      items: [
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
          id: 'guides/optimistic-updates',
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
          id: 'guides/abort',
        },
      ],
    },
    {
      type: 'category',
      collapsed: false,
      label: 'Data Guides',
      items: [
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
          id: 'guides/summary-list',
        },
      ],
    },
    {
      type: 'category',
      collapsed: false,
      label: 'Endpoint API',
      items: [
        {
          type: 'doc',
          id: 'api/RestEndpoint',
        },
        {
          type: 'doc',
          id: 'api/Endpoint',
        },
        {
          type: 'doc',
          id: 'api/createResource',
        },
        {
          type: 'doc',
          id: 'api/hookifyResource',
        },
        {
          type: 'doc',
          id: 'api/Query',
        },
        {
          type: 'doc',
          id: 'api/Index',
        },
      ],
    },
    {
      type: 'category',
      label: 'Schema API',
      collapsed: false,
      items: require('./sidebars-endpoint.json').slice(2),
    },
  ],
};
