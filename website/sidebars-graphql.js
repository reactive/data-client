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
      label: 'GraphQL API',
      items: [
        {
          type: 'doc',
          id: 'api/GQLEndpoint',
        },
        {
          type: 'doc',
          id: 'api/GQLEntity',
        },
      ],
    },
  ],
};
