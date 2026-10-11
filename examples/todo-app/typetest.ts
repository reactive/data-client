/* eslint-disable @typescript-eslint/no-unused-expressions */
import { useQuery, useController, useSuspense } from '@data-client/react';
// Subpath and @data-client/test declarations must parse on every supported TypeScript
import { DataProvider as NextDataProvider } from '@data-client/react/nextjs';
import { DataProvider as ReduxDataProvider } from '@data-client/react/redux';
import { Invalidate } from '@data-client/rest';
import { act, renderDataHook, renderHook } from '@data-client/test';

import {
  queryRemainingTodos,
  Todo,
  TodoResource,
} from './src/resources/TodoResource';
import { UserResource } from './src/resources/UserResource';

function useTest() {
  const ctrl = useController();
  const payload = { id: 1, title: '', userId: 1 };
  ctrl.fetch(TodoResource.getList.push, payload);
  ctrl.set(new Invalidate(Todo), { id: 1 });
  // @ts-expect-error title is a string
  ctrl.set(new Invalidate(Todo), { id: 1, title: false });

  const todos = useSuspense(TodoResource.getList, { userId: 1 });
  useSuspense(TodoResource.getList);
  todos.map((todo) => {
    todo.pk();
    todo.title;
    ctrl.fetch(
      TodoResource.partialUpdate,
      { id: todo.id },
      { completed: true },
    );
  });

  let remaining = useQuery(queryRemainingTodos, { userId: 1 });

  if (remaining !== undefined) remaining++;

  const users = useSuspense(UserResource.getList);
  users.map((user) => {
    user.name;
  });
}

// @data-client/test's act and renderHook stay typed (not any) on every supported TypeScript
async function testHooks() {
  const { result } = renderHook(() => 5);
  // @ts-expect-error current is a number
  const title: string = result.current;
  // @ts-expect-error act with a sync callback returns void
  const count: number = act(() => undefined);
  const resolved: number = await act(() => Promise.resolve(5));
  return [title, count, resolved];
}

export { NextDataProvider, ReduxDataProvider, renderDataHook, testHooks };
