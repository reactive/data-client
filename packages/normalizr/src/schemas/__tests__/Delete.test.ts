// eslint-env jest
import { fromJS } from 'immutable';

import { denormalize } from '../../denormalize';
import { normalize, schema } from '../../';
import IDEntity from '../../entities/IDEntity';
import { DELETED } from '../../special';

describe(`${schema.Delete.name} normalization`, () => {
  test('throws if not given an entity', () => {
    // @ts-expect-error
    expect(() => new schema.Delete()).toThrow();
  });

  test('normalizes an object', () => {
    class User extends IDEntity {}

    expect(
      normalize({ id: '1', type: 'users' }, new schema.Delete(User)),
    ).toMatchSnapshot();
  });
});

describe(`${schema.Union.name} denormalization`, () => {
  class User extends IDEntity {
    readonly username: string = '';
    readonly type: string = '';
  }
  const entities = {
    User: {
      '1': User.fromJS({ id: '1', username: 'Janey', type: 'users' }),
    },
  };

  test('denormalizes an object in the same manner as the Entity', () => {
    const [user, ready, deleted] = denormalize(
      '1',
      new schema.Delete(User),
      entities,
    );
    expect(user).toBeDefined();
    expect(user).toBeInstanceOf(User);
    expect(user?.username).toBe('Janey');
    expect(ready).toBe(true);
    expect(deleted).toBe(false);
  });

  test('denormalizes deleted entities as undefined', () => {
    const [user, ready, deleted] = denormalize('1', new schema.Delete(User), {
      User: { '1': DELETED },
    });
    expect(user).toBe(undefined);
    expect(ready).toBe(true);
    expect(deleted).toBe(true);

    expect(
      denormalize(
        { data: '1' },
        { data: new schema.Delete(User) },
        fromJS({ User: { '1': DELETED } }),
      ),
    ).toMatchSnapshot();
  });
});
