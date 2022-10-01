import { RestEndpoint, RestGenerics } from '@rest-hooks/rest';

import {
  createPlaceholderResource,
  PlaceholderEntity,
} from './PlaceholderBaseResource';

export class Todo extends PlaceholderEntity {
  readonly userId: number = 0;
  readonly title: string = '';
  readonly completed: boolean = false;
  readonly updatedAt: number = 0;

  static useIncoming(
    existingMeta: { date: number; fetchedAt: number },
    incomingMeta: { date: number; fetchedAt: number },
    existing: { updatedAt: number },
    incoming: { updatedAt: number },
  ) {
    return (
      existing.updatedAt === undefined ||
      existing.updatedAt <= incoming.updatedAt
    );
  }
}

export class TodoEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  getRequestInit(body?: any) {
    if (body) {
      body = { ...body, updatedAt: Date.now() };
    }
    return super.getRequestInit.call(this, body);
  }
}

const TodoResourceBase = createPlaceholderResource({
  path: 'https\\://jsonplaceholder.typicode.com/todos/:id',
  schema: Todo,
  Endpoint: TodoEndpoint,
});
export const TodoResource = {
  ...TodoResourceBase,
  partialUpdate: TodoResourceBase.partialUpdate.extend({
    getOptimisticResponse(snap, params, body) {
      return {
        id: params.id,
        ...snap.getResponse(TodoResourceBase.get, { id: params.id }).data,
        ...body,
        updatedAt: snap.fetchedAt,
      };
    },
  }),
  create: TodoResourceBase.create.extend({
    getOptimisticResponse(snap, body) {
      return { ...body, updatedAt: snap.fetchedAt };
    },
    update: (newResourceId: string) => ({
      [TodoResourceBase.getList.key()]: (resourceIds: string[] = []) => [
        ...resourceIds,
        newResourceId,
      ],
    }),
  }),
  delete: TodoResourceBase.delete.extend({
    getOptimisticResponse(snap, params) {
      return { ...params, updatedAt: snap.fetchedAt };
    },
  }),
};
