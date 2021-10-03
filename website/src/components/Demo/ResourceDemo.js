import React from 'react';
import * as restHooks from 'rest-hooks';
import * as rest from '@rest-hooks/rest';

import Playground from '../Playground';

const endpointCode = `class TodoResource extends Resource {
  pk() { return this.id }
  static urlRoot = 'https://jsonplaceholder.typicode.com/todos';
}`;

const scope = { ...restHooks, ...rest };

const code =
  endpointCode +
  '\n\n' +
  `function TodoDetail() {
  const todo = useResource(TodoResource.detail(), { id: 1 });
  return <div>{todo.title}</div>;
}
render(<TodoDetail/>);
`;

const ResourceDemo = props => (
  <Playground scope={scope} noInline>
    {code}
  </Playground>
);
export default ResourceDemo;
