import linkData from './sidebars-endpoint.json' assert { type: 'json' };

const redirects = linkData
  .filter(({ id }) => id !== 'api/Index')
  .map(({ id }) => ({
    to: `/rest/${id}`,
    from: [`/graphql/${id}`],
  }));
export default redirects;
