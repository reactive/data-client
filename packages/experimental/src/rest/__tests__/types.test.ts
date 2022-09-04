import { GetEndpoint } from '../RestEndpoint';
import { PathArgs, ShortenPath } from '../types';

describe('PathArgs', () => {
  it('should infer types', () => {
    type C =
      'http\\://test.com/groups/:group?/\\:blah/users/:id?/:next\\?bob/:last';
    function A(args: PathArgs<C>) {}
    // @ts-expect-error
    () => A({});
    () => A({ next: 'hi', last: 'ho' });
    // @ts-expect-error
    () => A({ next: 'hi', last: 'ho', doesnotexist: 'hi' });
    // @ts-expect-error
    () => A({ next: 'hi', last: 'ho', blah: 'hi' });
    () => A({ next: 'hi', last: 'ho', id: '5', group: 'whatever' });
  });

  it('should be flexible for string type', () => {
    class Parent {
      constructor() {}
      A(args: PathArgs<string>) {
        const b = args['hi'];
      }
    }
    class Child extends Parent {
      A(args: { item: string }) {}
    }
    const thing = new Parent();
    () => thing.A({});
    () => thing.A({ next: 'hi', last: 'ho' });
    const thing2 = new Child();
    //@ts-expect-error
    () => thing2.A({});
    () => thing2.A({ item: 'win' });
  });

  it('works when combining with known types', () => {
    const a: GetEndpoint<
      PathArgs<ShortenPath<'/hi'>> & { page: string | number }
    > = 0 as any;
    () => a({ page: '5' });
    //@ts-expect-error
    () => a({ sdf: '5' });
    //@ts-expect-error
    () => a({ page: '5' }, { hi: '5' });
    //@ts-expect-error
    () => a();
  });
});
