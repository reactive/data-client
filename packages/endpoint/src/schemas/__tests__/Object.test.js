// eslint-env jest
import { normalize, denormalize } from '@data-client/normalizr';
import { Temporal } from '@js-temporal/polyfill';
import { IDEntity } from '__tests__/new';
import { fromJS } from 'immutable';

import { schema } from '../../';
import Entity from '../Entity';

let dateSpy;
beforeAll(() => {
  dateSpy = jest

    .spyOn(global.Date, 'now')
    .mockImplementation(() => new Date('2019-05-14T11:01:58.135Z').valueOf());
});
afterAll(() => {
  dateSpy.mockRestore();
});

describe(`${schema.Object.name} normalization`, () => {
  test('normalizes an object', () => {
    class User extends IDEntity {}
    const object = new schema.Object({
      user: User,
    });
    expect(normalize(object, { user: { id: '1' } })).toMatchSnapshot();
  });

  test(`normalizes plain objects as shorthand for ${schema.Object.name}`, () => {
    class User extends IDEntity {}
    expect(normalize({ user: User }, { user: { id: '1' } })).toMatchSnapshot();
  });

  test('filters out undefined and null values', () => {
    class User extends Entity {}
    const users = new schema.Object({ foo: User, bar: User, baz: User });
    const oldenv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    expect(
      normalize(users, { foo: undefined, bar: { id: '1' } }),
    ).toMatchSnapshot();
    process.env.NODE_ENV = oldenv;
  });

  it('should deserialize Date', () => {
    class User extends IDEntity {}
    const WithOptional = new schema.Object({
      user: User,
      nextPage: '',
      createdAt: Temporal.Instant.from,
    });
    const normalized = normalize(WithOptional, {
      user: { id: '5' },
      nextPage: 'blob',
      createdAt: '2020-06-07T02:00:15.000Z',
    });
    expect(normalized.result.createdAt).toBe(normalized.result.createdAt);
    expect(typeof normalized.result.createdAt).toBe('string');
    expect(normalized).toMatchSnapshot();
  });

  it('should pass over when Date not provided', () => {
    class User extends IDEntity {}
    const WithOptional = new schema.Object({
      user: User,
      nextPage: '',
      createdAt: Temporal.Instant.from,
    });
    const normalized = normalize(WithOptional, {
      user: { id: '5' },
      nextPage: 'blob',
    });
    expect(normalized.result.createdAt).toBeUndefined();
    expect(normalized).toMatchSnapshot();
  });
});

describe(`${schema.Object.name} denormalization`, () => {
  test('denormalizes an object', () => {
    class User extends IDEntity {}
    const object = new schema.Object({
      user: User,
    });
    const entities = {
      User: {
        1: { id: '1', name: 'Nacho' },
      },
    };
    expect(denormalize(object, { user: '1' }, entities)).toMatchSnapshot();
    expect(
      denormalize(object, { user: '1' }, fromJS(entities)),
    ).toMatchSnapshot();
    expect(
      denormalize(object, fromJS({ user: '1' }), fromJS(entities)),
    ).toMatchSnapshot();
  });

  test('denormalizes an object with plain members', () => {
    class User extends IDEntity {}
    const object = new schema.Object({
      user: User,
      plain: '',
    });
    const entities = {
      User: {
        1: { id: '1', name: 'Nacho' },
      },
    };
    expect(denormalize(object, { user: '1' }, entities)).toMatchSnapshot();
    expect(
      denormalize(object, { user: '1' }, fromJS(entities)),
    ).toMatchSnapshot();
    expect(
      denormalize(object, fromJS({ user: '1' }), fromJS(entities)),
    ).toMatchSnapshot();
  });

  test('should have found = true with null member even when schema has nested entity', () => {
    class User extends IDEntity {}
    const object = new schema.Object({
      item: new schema.Object({
        user: User,
      }),
    });
    const entities = {
      User: {
        1: { id: '1', name: 'Nacho' },
      },
    };
    let value = denormalize(object, { item: null }, entities);
    expect(value).toMatchSnapshot();
    value = denormalize(object, { item: null }, fromJS(entities));
    expect(value).toMatchSnapshot();
    value = denormalize(object, fromJS({ item: null }), fromJS(entities));
    expect(value).toMatchSnapshot();
  });

  test('denormalizes plain object shorthand', () => {
    class User extends IDEntity {}
    const entities = {
      User: {
        1: { id: '1', name: 'Jane' },
      },
    };
    expect(
      denormalize(
        new schema.Object({ user: User, tacos: {} }),
        { user: '1' },
        entities,
      ),
    ).toMatchSnapshot();
    expect(
      denormalize(
        new schema.Object({ user: User, tacos: {} }),
        { user: '1' },
        fromJS(entities),
      ),
    ).toMatchSnapshot();
    expect(
      denormalize(
        new schema.Object({ user: User, tacos: {} }),
        fromJS({ user: '1' }),
        fromJS(entities),
      ),
    ).toMatchSnapshot();

    expect(
      denormalize(
        new schema.Object({ user: User, tacos: {} }),
        { user: '1', tacos: {} },
        entities,
      ),
    ).toMatchSnapshot();
    expect(
      denormalize(
        new schema.Object({ user: User, tacos: {} }),
        { user: '1', tacos: {} },
        fromJS(entities),
      ),
    ).toMatchSnapshot();
    expect(
      denormalize(
        new schema.Object({ user: User, tacos: {} }),
        fromJS({ user: '1', tacos: {} }),
        fromJS(entities),
      ),
    ).toMatchSnapshot();
  });

  test('denormalizes an object that contains a property representing a an object with an id of zero', () => {
    class User extends IDEntity {}
    const object = new schema.Object({
      user: User,
    });
    const entities = {
      User: {
        0: { id: '0', name: 'Chancho' },
      },
    };
    expect(denormalize(object, { user: '0' }, entities)).toMatchSnapshot();
    expect(
      denormalize(object, { user: '0' }, fromJS(entities)),
    ).toMatchSnapshot();
    expect(
      denormalize(object, fromJS({ user: '0' }), fromJS(entities)),
    ).toMatchSnapshot();
  });
});
