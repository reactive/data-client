// eslint-env jest
import { fromJS } from 'immutable';

import { denormalizeSimple as denormalize } from '../../denormalize';
import { normalize, schema } from '../../';
import IDEntity from '../../entities/IDEntity';

describe(`${schema.Object.name} normalization`, () => {
  test('normalizes an object', () => {
    class User extends IDEntity {}
    const object = new schema.Object({
      user: User,
    });
    expect(normalize({ user: { id: '1' } }, object)).toMatchSnapshot();
  });

  test(`normalizes plain objects as shorthand for ${schema.Object.name}`, () => {
    class User extends IDEntity {}
    expect(normalize({ user: { id: '1' } }, { user: User })).toMatchSnapshot();
  });

  test('filters out undefined and null values', () => {
    class User extends IDEntity {}
    const users = { foo: User, bar: User, baz: User };
    expect(normalize({ foo: {}, bar: { id: '1' } }, users)).toMatchSnapshot();
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
        '1': { id: '1', name: 'Nacho' },
      },
    };
    expect(denormalize({ user: '1' }, object, entities)).toMatchSnapshot();
    expect(
      denormalize({ user: '1' }, object, fromJS(entities)),
    ).toMatchSnapshot();
    expect(
      denormalize(fromJS({ user: '1' }), object, fromJS(entities)),
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
        '1': { id: '1', name: 'Nacho' },
      },
    };
    expect(denormalize({ user: '1' }, object, entities)).toMatchSnapshot();
    expect(
      denormalize({ user: '1' }, object, fromJS(entities)),
    ).toMatchSnapshot();
    expect(
      denormalize(fromJS({ user: '1' }), object, fromJS(entities)),
    ).toMatchSnapshot();
  });

  test('should have found = true with null member even when schema has nested entity', () => {
    class User extends IDEntity {}
    const object = {
      item: new schema.Object({
        user: User,
      }),
    };
    const entities = {
      User: {
        '1': { id: '1', name: 'Nacho' },
      },
    };
    let [value, found] = denormalize({ item: null }, object, entities);
    expect(value).toMatchSnapshot();
    expect(found).toBe(true);
    [value, found] = denormalize({ item: null }, object, fromJS(entities));
    expect(value).toMatchSnapshot();
    expect(found).toBe(true);
    [value, found] = denormalize(
      fromJS({ item: null }),
      object,
      fromJS(entities),
    );
    expect(value).toMatchSnapshot();
    expect(found).toBe(true);
  });

  test('denormalizes plain object shorthand', () => {
    class User extends IDEntity {}
    const entities = {
      User: {
        '1': { id: '1', name: 'Jane' },
      },
    };
    expect(
      denormalize({ user: '1' }, { user: User, tacos: {} }, entities),
    ).toMatchSnapshot();
    expect(
      denormalize({ user: '1' }, { user: User, tacos: {} }, fromJS(entities)),
    ).toMatchSnapshot();
    expect(
      denormalize(
        fromJS({ user: '1' }),
        { user: User, tacos: {} },
        fromJS(entities),
      ),
    ).toMatchSnapshot();

    expect(
      denormalize(
        { user: '1', tacos: {} },
        { user: User, tacos: {} },
        entities,
      ),
    ).toMatchSnapshot();
    expect(
      denormalize(
        { user: '1', tacos: {} },
        { user: User, tacos: {} },
        fromJS(entities),
      ),
    ).toMatchSnapshot();
    expect(
      denormalize(
        fromJS({ user: '1', tacos: {} }),
        { user: User, tacos: {} },
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
        '0': { id: '0', name: 'Chancho' },
      },
    };
    expect(denormalize({ user: '0' }, object, entities)).toMatchSnapshot();
    expect(
      denormalize({ user: '0' }, object, fromJS(entities)),
    ).toMatchSnapshot();
    expect(
      denormalize(fromJS({ user: '0' }), object, fromJS(entities)),
    ).toMatchSnapshot();
  });
});
