import { Entity, schema } from '@rest-hooks/endpoint';
import { useSuspense } from '@rest-hooks/react';
import { User } from '__tests__/new';

import createResource from '../createResource';
import RestEndpoint, { MutateEndpoint } from '../RestEndpoint';

it('RestEndpoint construct and extend with typed options', () => {
  new RestEndpoint({
    path: '/todos/',
    getOptimisticResponse(snap, body) {
      return body;
    },
    schema: User,
    method: 'POST',
  });
  // variable/unknown number of args
  new RestEndpoint({
    path: '/todos/',
    searchParams: {} as { userId?: string | number } | undefined,
    getOptimisticResponse(snap, ...args) {
      return args[args.length - 1];
    },
    schema: User,
    method: 'POST',
  });
  new RestEndpoint({
    path: '/todos/:id',
    searchParams: {} as { userId?: string | number } | undefined,
    getOptimisticResponse(snap, args, body) {
      return body;
    },
    schema: User,
    method: 'POST',
  });
  /*new RestEndpoint({
    path: '/todos/:id',
    searchParams: {} as { userId?: string | number } | undefined,
    getOptimisticResponse(snap, args) {
      return args as any;
    },
    schema: User,
    method: 'POST',
  });*/

  const nopath = new RestEndpoint({
    path: '/todos/',
    schema: User,
    method: 'POST',
  });
  const somepath = new RestEndpoint({
    path: '/todos/:id',
    schema: User,
    method: 'POST',
  });

  nopath.extend({
    getOptimisticResponse(snap, body) {
      return body;
    },
  });
  nopath.extend({
    searchParams: {} as { userId?: string | number } | undefined,
    getOptimisticResponse(snap, ...args) {
      return args[args.length - 1];
    },
  });
  somepath.extend({
    searchParams: {} as { userId?: string | number } | undefined,
    getOptimisticResponse(snap, args, body) {
      return body;
    },
  });
});

it('should customize resources', () => {
  class Todo extends Entity {
    id = '';
    userId = 0;
    title = '';
    completed = false;

    static key = 'Todo';
    pk() {
      return this.id;
    }
  }

  const TodoResource = createResource({
    path: '/todos/:id',
    schema: Todo,
  });
  TodoResource.create.extend({
    searchParams: {} as { userId?: string | number } | undefined,
    getOptimisticResponse(snap, body) {
      return body;
    },
  });
  const partial = TodoResource.partialUpdate.extend({
    getOptimisticResponse(snap, { id }, body) {
      return {
        id,
        ...body,
      };
    },
  });
  () => partial({ id: 5 }, { title: 'hi' });
  const a: MutateEndpoint<{
    path: '/todos/';
    body: Partial<Todo>;
    schema: typeof Todo;
  }> = TodoResource.create.extend({ schema: Todo }) as any;
  a.extend({
    searchParams: {} as { userId?: string | number } | undefined,
    getOptimisticResponse(snap, body) {
      return body;
    },
  });

  () => useSuspense(TodoResource.getList);
});
