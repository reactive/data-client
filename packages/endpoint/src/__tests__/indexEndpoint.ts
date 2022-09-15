import Entity from '../schemas/Entity';
import { Index } from '../indexEndpoint';

describe('Index', () => {
  class User extends Entity {
    readonly id: string = '';
    readonly username: string = '';

    pk() {
      return this.id;
    }

    static indexes = ['username'] as const;
  }

  it('constructs', () => {
    const UserIndex = new Index(User);

    expect(UserIndex.key({ username: 'hi' })).toMatchInlineSnapshot(
      `"{"username":"hi"}"`,
    );

    //@ts-expect-error
    UserIndex.key({ username: 5 });
    //@ts-expect-error
    UserIndex.key({ blah: 5 });
  });

  it('constructs with key', () => {
    const UserIndex = new Index(User, ({ username }) => `${username}`);

    expect(UserIndex.key({ username: 'hi' })).toMatchInlineSnapshot(`"hi"`);

    //@ts-expect-error
    UserIndex.key({ username: 5 });
    //@ts-expect-error
    UserIndex.key({ blah: 5 });
  });

  it('legacy compat', () => {
    const UserIndex = new Index(User);

    expect(UserIndex.getFetchKey({ username: 'hi' })).toMatchInlineSnapshot(
      `"{"username":"hi"}"`,
    );

    //@ts-expect-error
    UserIndex.getFetchKey({ username: 5 });
    //@ts-expect-error
    UserIndex.getFetchKey({ blah: 5 });
  });
});
