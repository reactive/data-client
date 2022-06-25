module.exports = {
  docs: [
    {
      type: 'doc',
      id: 'usage',
    },
    {
      type: 'doc',
      id: 'auth',
    },
    {
      type: 'category',
      label: '@rest-hooks/endpoint',
      collapsed: false,
      items: require('./sidebars-endpoint.json'),
    },
  ],
};
