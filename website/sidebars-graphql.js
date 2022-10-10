module.exports = {
  docs: [
    {
      type: 'doc',
      id: 'README',
    },
    {
      type: 'doc',
      id: 'auth',
    },
    {
      type: 'category',
      collapsed: false,
      label: 'Endpoint API',
      items: [
        {
          type: 'doc',
          id: 'api/GQLEndpoint',
        },
        {
          type: 'doc',
          id: 'api/Endpoint',
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
