---
title: schema.Collection
---

<head>
  <title>schema.Collection - Entities of Arrays or Values</title>
</head>

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import LanguageTabs from '@site/src/components/LanguageTabs';
import HooksPlayground from '@site/src/components/HooksPlayground';
import { RestEndpoint } from '@data-client/rest';
import { v4 as uuid } from 'uuid';

Collections are entities but for [Arrays](./Array.md) or [Values](./Values.md).

Collections implement the EntityInterface. By using the same lifecycle methods they give the same
high performance and data integrity of [Entity](./Entity.md), but for [Arrays](./Array.md) or [Values](./Values.md).

## Usage

To describe a simple array of a singular entity type:

<HooksPlayground groupId="schema" defaultOpen="y" fixtures={[
{
endpoint: new RestEndpoint({path: '/todos'}),
args: [],
response: [
{ id: '123', title: 'Build Collections' },
{ id: '456', title: 'Add atomic creation' },
],
delay: 150,
},
{
endpoint: new RestEndpoint({path: '/todos', method: 'POST'}),
args: [],
response(body) {
return {id: uuid(),...body};
},
delay: 150,
},
]}>

```ts title="api/Todo" {15-17}
export class Todo extends Entity {
  id = '';
  userId = 0;
  title = '';
  completed = false;

  pk() {
    return this.id;
  }
  static key = 'Todo';
}

export const getTodos = new RestEndpoint({
  path: '/todos',
  schema: new schema.Collection([Todo], {
    argsKey: urlParams => ({ ...urlParams }),
  }),
});
```

```tsx title="NewTodo" {9}
import { getTodos } from './api/Todo';

export default function NewTodo({ userId }: { userId?: number }) {
  const ctrl = useController();

  const handlePress = React.useCallback(
    async (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        ctrl.fetch(getTodos.push, { title: e.currentTarget.value, userId });
        e.currentTarget.value = '';
      }
    },
    [ctrl],
  );

  return (
    <div>
      <input type="text" onKeyDown={handlePress} />
    </div>
  );
}
```

```tsx title="TodoList" collapsed
import { getTodos } from './api/Todo';
import NewTodo from './NewTodo';

function TodoList() {
  const todos = useSuspense(getTodos);
  return (
    <div>
      {todos.map(todo => (
        <div key={todo.pk()}>{todo.title}</div>
      ))}
      <NewTodo />
    </div>
  );
}
render(<TodoList />);
```

</HooksPlayground>
