// eslint-env jest
import { fromJS } from 'immutable';
import { normalize } from '@rest-hooks/normalizr';
import { IDEntity } from '__tests__/new';

import denormalize from './denormalize';
import { schema } from '../../';
import Entity from '../Entity';
import { DELETED } from '../../special';

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

  test('normalizes already processed entities', () => {
    class MyEntity extends IDEntity {}
    expect(normalize('1', new schema.Delete(MyEntity))).toMatchSnapshot();
  });

  test('does not infer', () => {
    class User extends IDEntity {}

    expect(
      new schema.Delete(User).infer([{ id: 5 }], {}, () => undefined),
    ).toBeUndefined();
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
      normalize({ secondthing: 'hi' }, new schema.Delete(MyEntity));
    }
    expect(normalizeBad).toThrowErrorMatchingSnapshot();
  });
});

describe(`${schema.Delete.name} denormalization`, () => {
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

  test.each([
    ['direct', (data: any) => data],
    ['immutable', fromJS],
  ] as const)(
    `denormalizes deleted entities as undefined (%s)`,
    (_, createInput) => {
      const [user, ready, deleted] = denormalize('1', new schema.Delete(User), {
        User: { '1': DELETED },
      });
      expect(user).toBe(undefined);
      expect(ready).toBe(true);
      expect(deleted).toBe(true);

      expect(
        denormalize(
          createInput([{ data: '1' }]),
          new schema.Array(
            new schema.Object({ data: new schema.Delete(User) }),
          ),
          createInput([{ User: { '1': DELETED } }]),
        ),
      ).toMatchSnapshot();

      expect(
        denormalize(
          createInput([{ data: '1' }]),
          [{ data: new schema.Delete(User) }],
          createInput([{ User: { '1': DELETED } }]),
        ),
      ).toMatchSnapshot();

      expect(
        denormalize(
          createInput([{ data: '1' }]),
          new schema.Array(new schema.Object({ data: User })),
          createInput([{ User: { '1': DELETED } }]),
        ),
      ).toMatchSnapshot();

      expect(
        denormalize(
          createInput([{ data: '1' }]),
          [{ data: User }],
          createInput([{ User: { '1': DELETED } }]),
        ),
      ).toMatchSnapshot();

      expect(
        denormalize(
          createInput({ data: '1' }),
          new schema.Object({ data: User }),
          createInput({ User: { '1': DELETED } }),
        ),
      ).toMatchSnapshot();

      expect(
        denormalize(
          createInput({ data: '1' }),
          { data: User },
          createInput({ User: { '1': DELETED } }),
        ),
      ).toMatchSnapshot();
    },
  );
});
