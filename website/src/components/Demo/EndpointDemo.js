import React from 'react';
import * as restHooks from 'rest-hooks';

import Playground from '../Playground';

const endpointCode = `const fetchTodoDetail = async ({ id }) =>
      (await fetch(\`https://jsonplaceholder.typicode.com/todos/\${id}\`)).json()
const todoDetail = new Endpoint(fetchTodoDetail);`;

const scope = { ...restHooks };

const code =
  endpointCode +
  '\n\n' +
  `function TodoDetail() {
  const todo = useResource(todoDetail, { id: 1 });
  return <div>{todo.title}</div>;
}
render(<TodoDetail/>);
`;

const EndpointDemo = props => (
  <Playground scope={scope} noInline groupId="homepage-demo">
    {code}
  </Playground>
);
export default EndpointDemo;
