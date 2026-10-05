import type { SetValue as NormalizrSetValue } from '../../../normalizr/src/setTypes';
import { Collection, Entity, Query, Union } from '../index';
import type { SetValue } from '../setTypes';

// endpoint mirrors normalizr's SetValue (getOptimisticResponse() vs Controller.set()); fails when they drift
type Same<A, B> =
  [A] extends [B] ?
    [B] extends [A] ?
      true
    : false
  : false;
function assertSame<S>(same: Same<SetValue<S>, NormalizrSetValue<S>>) {
  return same;
}

class Todo extends Entity {
  id = '';
  title = '';
  completed = false;
  votes = 0;
}
class Post extends Entity {
  id = '';
  readonly type = 'post' as const;
  body = '';
}
class Comment extends Entity {
  id = '';
  readonly type = 'comment' as const;
  text = '';
}
const todos = new Collection([Todo]);
const feed = new Union({ post: Post, comment: Comment }, 'type');
const doneCount = new Query(
  todos,
  (rows: Todo[]) => rows.filter(todo => todo.completed).length,
);

it('endpoint SetValue matches normalizr SetValue', () => {
  expect(assertSame<typeof Todo>(true)).toBe(true);
  expect(assertSame<typeof todos>(true)).toBe(true);
  expect(assertSame<typeof feed>(true)).toBe(true);
  expect(assertSame<typeof doneCount>(true)).toBe(true);
  expect(assertSame<{ todo: typeof Todo; tags: string[] }>(true)).toBe(true);
});
