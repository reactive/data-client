import { Collection, Entity } from '@data-client/endpoint';
import { normalize } from '@data-client/normalizr';

import RestEndpoint from '../RestEndpoint';

class Todo extends Entity {
  id = '';
}
const getTodos = new RestEndpoint({
  path: '/todos',
  searchParams: {} as { cursor?: string },
  paginationField: 'cursor',
  schema: new Collection([Todo]),
});
const at = (t: number) => ({ date: t, expiresAt: Infinity, fetchedAt: t });
const firstPage = [{ id: '1' }, { id: '2' }];
const list = (state: any) => state.entities[getTodos.schema.key]['{}'];

describe('getPage responses older than the stored list', () => {
  // load more starts at 10; a refetch of the first page starts at 20 and lands first
  const refetched = (page: any[]) =>
    normalize(
      getTodos.schema,
      page,
      [{}],
      normalize(getTodos.schema, firstPage, [{}], undefined, at(0)),
      at(20),
    );

  it('still appends the page', () => {
    const state = normalize(
      getTodos.getPage.schema,
      [{ id: '3' }, { id: '4' }],
      [{ cursor: '2' }],
      refetched(firstPage),
      at(10),
    );
    expect(list(state)).toEqual(['1', '2', '3', '4']);
  });

  it('skips items the newer list already has', () => {
    // an item was created at the top, pushing 2 onto the next page
    const state = normalize(
      getTodos.getPage.schema,
      [{ id: '2' }, { id: '3' }],
      [{ cursor: '1' }],
      refetched([{ id: '0' }, ...firstPage]),
      at(10),
    );
    expect(list(state)).toEqual(['0', '1', '2', '3']);
  });
});
