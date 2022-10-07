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
      type: 'doc',
      id: 'api/GQLEndpoint',
    },
    {
      type: 'category',
      label: '@rest-hooks/endpoint',
      collapsed: false,
      items: require('./sidebars-endpoint.json'),
    },
  ],
};
