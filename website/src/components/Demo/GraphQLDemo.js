import React from 'react';
import * as restHooks from 'rest-hooks';
import * as graphql from '@rest-hooks/graphql';

import Playground from '../Playground';

const endpointCode = `const gql = new GQLEndpoint('https://nosy-baritone.glitch.me');
const userDetail = gql.query(\`
  query UserDetail($name: String!) {
    user(name: $name) {
      id
      name
      email
    }
  }
\`);`;

const scope = { ...restHooks, ...graphql };

const code =
  endpointCode +
  '\n\n' +
  `function UserDetail() {
  const { user } = useResource(userDetail, { name: 'Fong' });
  return <div>{user.email}</div>;
}
render(<UserDetail/>);
`;

const GraphQLDemo = props => (
  <Playground scope={scope} noInline>
    {code}
  </Playground>
);
export default GraphQLDemo;
