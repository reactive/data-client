import { PathArgs } from '../types';

describe('types', () => {
  it('should infer types', () => {
    type C = 'http\\://test.com/groups/:group?/users/:id?/:next\\?bob/:last';
    function A(args: PathArgs<C>) {}
    // @ts-expect-error
    () => A({});
    () => A({ next: 'hi', last: 'ho' });
    // @ts-expect-error
    () => A({ next: 'hi', last: 'ho', doesnotexist: 'hi' });
    () => A({ next: 'hi', last: 'ho', id: '5', group: 'whatever' });
  });
});
