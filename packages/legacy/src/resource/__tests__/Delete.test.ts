// eslint-env jest
import { fromJS } from 'immutable';
import { normalize, denormalize, DELETED } from '@rest-hooks/normalizr';
import { schema } from '@rest-hooks/endpoint';

import Delete from '../Delete';
import IDEntity from '../IDEntity';
import Entity from '../Entity';

let dateSpy: jest.SpyInstance;
beforeAll(() => {
  dateSpy = jest
    // eslint-disable-next-line no-undef
    .spyOn(global.Date, 'now')
    .mockImplementation(() => new Date('2019-05-14T11:01:58.135Z').valueOf());
});
afterAll(() => {
  dateSpy.mockRestore();
});

describe(`${Delete.name} normalization`, () => {
  test('throws if not given an entity', () => {
    // @ts-expect-error
    expect(() => new Delete()).toThrow();
  });

  test('normalizes an object', () => {
    class User extends IDEntity {}

    expect(
      normalize({ id: '1', type: 'users' }, new Delete(User)),
    ).toMatchSnapshot();
  });

  it('should throw a custom error if data does not include pk', () => {
    class MyEntity extends Entity {
      readonly name: string = '';
      readonly secondthing: string = '';
      pk() {
        return this.name;
      }
    }
    function normalizeBad() {
      normalize({ secondthing: 'hi' }, new Delete(MyEntity));
    }
    expect(normalizeBad).toThrowErrorMatchingSnapshot();
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
    const [user, ready, deleted] = denormalize('1', new Delete(User), entities);
    expect(user).toBeDefined();
    expect(user).toBeInstanceOf(User);
    expect(user?.username).toBe('Janey');
    expect(ready).toBe(true);
    expect(deleted).toBe(false);
  });

  test('denormalizes deleted entities as undefined', () => {
    const [user, ready, deleted] = denormalize('1', new Delete(User), {
      User: { '1': DELETED },
    });
    expect(user).toBe(undefined);
    expect(ready).toBe(true);
    expect(deleted).toBe(true);

    expect(
      denormalize(
        { data: '1' },
        { data: new Delete(User) },
        fromJS({ User: { '1': DELETED } }),
      ),
    ).toMatchSnapshot();
  });
});
