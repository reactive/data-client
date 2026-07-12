// eslint-env jest
import { IDEntity } from '__tests__/new';
import { fromJS } from 'immutable';

import { schema } from '../..';
import type { IDenormalizeDelegate } from '../../interface';

/** Delegate shaped like older @data-client/normalizr versions:
 * no `unvisitObject`, no `getField`. New endpoint schemas must fall back
 * to the plain (POJO) path so wide version ranges keep working. */
function makeLegacyDelegate(
  unvisit: (s: any, input: any) => any,
): IDenormalizeDelegate {
  return {
    args: [],
    unvisit,
    argsKey(fn: (args: readonly any[]) => string | undefined) {
      return fn([]);
    },
  };
}

class User extends IDEntity {
  name = '';
  type = 'users';
  static key = 'User';
}
class Admin extends IDEntity {
  name = '';
  type = 'admins';
  static key = 'Admin';
}

describe('cross-version delegate compatibility (old normalizr shapes)', () => {
  test('Object denormalize falls back to the plain loop', () => {
    const object = new schema.Object({ user: User });
    const delegate = makeLegacyDelegate((s, input) =>
      s === User ? { id: input, name: 'resolved' } : input,
    );

    expect(object.denormalize({ user: '1', extra: 'kept' }, delegate)).toEqual({
      user: { id: '1', name: 'resolved' },
      extra: 'kept',
    });
  });

  test('Object denormalize propagates the exact nested symbol', () => {
    const INVALID_LIKE = Symbol('INVALID from another package');
    const object = new schema.Object({ user: User });
    const delegate = makeLegacyDelegate(() => INVALID_LIKE);

    expect(object.denormalize({ user: '1' }, delegate)).toBe(INVALID_LIKE);
  });

  test('Union denormalize reads discriminators with direct property access', () => {
    const union = new schema.Union({ users: User, admins: Admin }, 'type');
    const visited: any[] = [];
    const delegate = makeLegacyDelegate((s, input) => {
      visited.push([s, input]);
      return { resolved: input };
    });

    expect(union.denormalize({ id: '5', schema: 'admins' }, delegate)).toEqual({
      resolved: '5',
    });
    expect(visited).toEqual([[Admin, '5']]);
  });

  test('new-style delegates route Object denormalize through unvisitObject', () => {
    const object = new schema.Object({ user: User });
    const unvisitObject = jest.fn(() => 'from-policy');
    const delegate = {
      ...makeLegacyDelegate((s, input) => input),
      unvisitObject,
      getField: (value: any, key: string) => value[key],
    };

    expect(object.denormalize({ user: '1' }, delegate)).toBe('from-policy');
    expect(unvisitObject).toHaveBeenCalledWith({ user: User }, { user: '1' });
  });

  test('immutable input with legacy delegate fails loudly in development', () => {
    const object = new schema.Object({ user: User });
    const delegate = makeLegacyDelegate((s, input) => input);

    expect(() =>
      object.denormalize(fromJS({ user: '1' }) as any, delegate),
    ).toThrow(/Immutable input is not supported by the default denormalize/);
  });
});
