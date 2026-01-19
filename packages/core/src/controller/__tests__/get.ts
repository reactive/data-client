import { Entity, Collection, All, Query, Union } from '@data-client/endpoint';

import { initialState } from '../../state/reducer/createReducer';
import { State } from '../../types';
import Controller from '../Controller';

class Tacos extends Entity {
  type = '';
  id = '';
}
const TacoList = new Collection([Tacos]);
const entities = {
  Tacos: {
    1: { id: '1', type: 'foo' },
    2: { id: '2', type: 'bar' },
  },
  [TacoList.key]: {
    [TacoList.pk(undefined, undefined, '', [{ type: 'foo' }])]: ['1'],
    [TacoList.pk(undefined, undefined, '', [{ type: 'bar' }])]: ['2'],
    [TacoList.pk(undefined, undefined, '', [])]: ['1', '2'],
  },
};

describe('Controller.get()', () => {
  it('query Entity based on pk', () => {
    const controller = new Controller();
    const state = {
      ...initialState,
      entities,
    };
    const taco = controller.get(Tacos, { id: '1' }, state);
    expect(taco).toBeDefined();
    expect(taco).toBeInstanceOf(Tacos);
    expect(taco).toMatchSnapshot();
    const taco2 = controller.get(Tacos, { id: '2' }, state);
    expect(taco2).toBeDefined();
    expect(taco2).toBeInstanceOf(Tacos);
    expect(taco2).not.toEqual(taco);
    // should maintain referential equality
    expect(taco).toBe(controller.get(Tacos, { id: '1' }, state));

    // @ts-expect-error
    () => controller.get(Tacos, { id: { bob: 5 } }, state);
    // @ts-expect-error
    expect(controller.get(Tacos, 5, state)).toBeUndefined();
    // @ts-expect-error
    () => controller.get(Tacos, { doesnotexist: 5 }, state);
  });

  describe('indexes', () => {
    class User extends Entity {
      id = '';
      username = '';
      staff = false;

      static indexes = ['username'] as const;
    }
    it('query Entity based on index', () => {
      const controller = new Controller();
      const state: State<unknown> = {
        ...initialState,
        entities: {
          User: {
            '1': { id: '1', username: 'bob' },
            '2': { id: '2', username: 'george' },
          },
        },
        indexes: {
          User: {
            username: {
              bob: '1',
              george: '2',
            },
          },
        },
      };

      const bob = controller.get(User, { username: 'bob' }, state);
      expect(bob).toBeDefined();
      expect(bob).toBeInstanceOf(User);
      expect(bob).toMatchSnapshot();
      // stability
      expect(controller.get(User, { username: 'bob' }, state)).toBe(bob);
      // should be same as id lookup
      expect(controller.get(User, { id: '1' }, state)).toBe(bob);
      // update index
      let nextState: State<unknown> = {
        ...state,
        entities: {
          ...state.entities,
          User: {
            ...state.entities.User,
            '1': { id: '1', username: 'george' },
            '2': { id: '2', username: 'bob' },
          },
        },
        indexes: {
          ...state.indexes,
          User: {
            ...state.indexes.User,
            username: {
              ...state.indexes.User.username,
              bob: '2',
              george: '1',
            },
          },
        },
      };
      expect(controller.get(User, { username: 'bob' }, nextState)).not.toBe(
        bob,
      );
      nextState = {
        ...state,
        entities: {
          ...state.entities,
          User: {
            ...state.entities.User,
            '1': { id: '1', username: 'bob', staff: true },
          },
        },
      };
      // update entity keep index
      const nextBob = controller.get(User, { username: 'bob' }, nextState);
      expect(nextBob).not.toBe(bob);
      expect(nextBob).toBeDefined();
      expect(nextBob).toBeInstanceOf(User);
      expect(nextBob?.staff).toBe(true);
    });

    it('query indexes after empty state', () => {
      const controller = new Controller();
      expect(
        controller.get(User, { username: 'bob' }, initialState),
      ).toBeUndefined();
      const state: State<unknown> = {
        ...initialState,
        entities: {
          User: {
            '1': { id: '1', username: 'bob' },
            '2': { id: '2', username: 'george' },
          },
        },
        indexes: {
          User: {
            username: {
              bob: '1',
              george: '2',
            },
          },
        },
      };
      const bob = controller.get(User, { username: 'bob' }, state);
      expect(bob).toBeDefined();
      expect(bob).toBeInstanceOf(User);
      expect(bob).toMatchSnapshot();
    });
  });

  it('query Collection based on args', () => {
    const controller = new Controller();
    const state = {
      ...initialState,
      entities,
    };
    const tacos = controller.get(TacoList, { type: 'foo' }, state);
    expect(tacos).toBeDefined();
    expect(tacos?.[0]).toBeInstanceOf(Tacos);
    expect(tacos).toMatchSnapshot();
    const tacosBars = controller.get(TacoList, { type: 'bar' }, state);
    expect(tacosBars).toBeDefined();
    expect(tacosBars?.[0]).toBeInstanceOf(Tacos);
    expect(tacosBars).not.toEqual(tacos);
    // should maintain referential equality
    expect(tacos).toBe(controller.get(TacoList, { type: 'foo' }, state));

    const allTacos = controller.get(TacoList, state);
    expect(allTacos).toBeDefined();
    expect(allTacos).toHaveLength(2);
    expect(allTacos).toMatchSnapshot();

    // @ts-expect-error
    () => controller.get(TacoList, 5, state);
  });

  describe('query All', () => {
    const controller = new Controller();
    const state = {
      ...initialState,
      entities,
    };
    const AllTacos = new All(Tacos);

    it('should get all entities', () => {
      const allTacos = controller.get(AllTacos, state);
      expect(allTacos).toBeDefined();
      expect(allTacos).toHaveLength(2);
      expect(allTacos).toMatchSnapshot();

      // TODO: @ts-expect-error (we have a hack to make this not break other things now)
      () => controller.get(AllTacos, 5, state);
    });

    it('should maintain referential equality', () => {
      const allTacos = controller.get(AllTacos, state);
      expect(allTacos).toStrictEqual(controller.get(TacoList, state));
    });

    it('should include new entities when added', () => {
      controller.get(AllTacos, state);
      const tacosWithExtra = controller.get(AllTacos, {
        ...state,
        entities: {
          ...entities,
          Tacos: {
            ...entities.Tacos,
            3: { id: '3', type: 'extra' },
          },
        },
      });
      expect(tacosWithExtra).toBeDefined();
      expect(tacosWithExtra).toHaveLength(3);
      expect(tacosWithExtra).toMatchSnapshot();
    });
  });

  it('Query+All based on args', () => {
    const controller = new Controller();
    const state = {
      ...initialState,
      entities,
    };
    const queryTacos = new Query(
      new All(Tacos),
      (tacos, { type }: { type?: string } = {}) => {
        if (!type) return tacos;
        return tacos.filter(taco => taco.type === type);
      },
    );

    const tacos = controller.get(queryTacos, { type: 'foo' }, state);
    expect(tacos).toBeDefined();
    expect(tacos?.[0]).toBeInstanceOf(Tacos);
    expect(tacos).toMatchSnapshot();
    const tacosBars = controller.get(queryTacos, { type: 'bar' }, state);
    expect(tacosBars).toBeDefined();
    expect(tacosBars?.[0]).toBeInstanceOf(Tacos);
    expect(tacosBars).not.toEqual(tacos);
    // should maintain referential equality
    expect(tacos).toBe(controller.get(queryTacos, { type: 'foo' }, state));

    const allTacos = controller.get(queryTacos, state);
    expect(allTacos).toBeDefined();
    expect(allTacos).toHaveLength(2);
    expect(allTacos).toMatchSnapshot();

    // @ts-expect-error
    () => controller.get(queryTacos, 5, state);

    const tacosWithExtra = controller.get(
      queryTacos,
      { type: 'bar' },
      {
        ...state,
        entities: {
          ...entities,
          Tacos: {
            ...entities.Tacos,
            3: { id: '3', type: 'bar', name: 'thing3' },
          },
        },
      },
    );
    expect(tacosWithExtra).toBeDefined();
    expect(tacosWithExtra).toHaveLength(2);
    expect(tacosWithExtra).toMatchSnapshot();
  });

  it('Query+Collection based on args', () => {
    const controller = new Controller();
    const state = {
      ...initialState,
      entities,
    };
    const tacoCount = new Query(TacoList, tacos => {
      return tacos.length ?? 0;
    });

    expect(controller.get(tacoCount, { type: 'foo' }, state)).toBe(1);
    expect(controller.get(tacoCount, { type: 'bar' }, state)).toBe(1);
    expect(controller.get(tacoCount, state)).toBe(2);
  });

  it('Union based on args', () => {
    class IDEntity extends Entity {
      id: string = '';
    }
    class User extends IDEntity {
      type = 'users';
      username: string = '';
    }
    class Group extends IDEntity {
      type = 'groups';
      groupname: string = '';
      memberCount = 0;
    }
    const queryPerson = new Union(
      {
        users: User,
        groups: Group,
      },
      'type',
    );
    const controller = new Controller();
    const state = {
      ...initialState,
      entities: {
        User: {
          '1': { id: '1', type: 'users', username: 'bob' },
        },
        Group: {
          '2': { id: '2', type: 'groups', groupname: 'fast', memberCount: 5 },
        },
      },
    };
    const user = controller.get(queryPerson, { id: '1', type: 'users' }, state);
    expect(user).toBeDefined();
    expect(user).toBeInstanceOf(User);
    expect(user).toMatchSnapshot();
    const group = controller.get(
      queryPerson,
      { id: '2', type: 'groups' },
      state,
    );
    expect(group).toBeDefined();
    expect(group).toBeInstanceOf(Group);
    expect(group).toMatchSnapshot();

    // should maintain referential equality
    expect(user).toBe(
      controller.get(queryPerson, { id: '1', type: 'users' }, state),
    );

    // @ts-expect-error
    () => controller.get(queryPerson, { id: { bob: 5 } }, state);
    // @ts-expect-error
    expect(controller.get(queryPerson, 5, state)).toBeUndefined();
    // @ts-expect-error
    () => controller.get(queryPerson, { doesnotexist: 5 }, state);
    // @ts-expect-error
    () => controller.get(queryPerson, { id: '1', doesnotexist: 5 }, state);
  });

  it('Union based on args with function schemaAttribute', () => {
    class IDEntity extends Entity {
      id: string = '';
    }
    class User extends IDEntity {
      type = 'user';
      username: string = '';
    }
    class Group extends IDEntity {
      type = 'group';
      groupname: string = '';
      memberCount = 0;
    }
    const queryPerson = new Union(
      {
        users: User,
        groups: Group,
      },
      (value: { type: 'users' | 'groups' }) => value.type,
    );
    const controller = new Controller();
    const state = {
      ...initialState,
      entities: {
        User: {
          '1': { id: '1', type: 'users', username: 'bob' },
        },
        Group: {
          '2': { id: '2', type: 'groups', groupname: 'fast', memberCount: 5 },
        },
      },
    };
    const user = controller.get(queryPerson, { id: '1', type: 'users' }, state);
    expect(user).toBeDefined();
    expect(user).toBeInstanceOf(User);
    expect(user).toMatchSnapshot();
    const group = controller.get(
      queryPerson,
      { id: '2', type: 'groups' },
      state,
    );
    expect(group).toBeDefined();
    expect(group).toBeInstanceOf(Group);
    expect(group).toMatchSnapshot();

    // should maintain referential equality
    expect(user).toBe(
      controller.get(queryPerson, { id: '1', type: 'users' }, state),
    );

    // these are the 'fallback case' where it cannot determine type discriminator, so just enumerates
    () => controller.get(queryPerson, { id: '1' }, state);
    // @ts-expect-error
    () => controller.get(queryPerson, { id: '1', type: 'notrealtype' }, state);
    // @ts-expect-error
    () => controller.get(queryPerson, { id: { bob: 5 }, type: 'users' }, state);
    // @ts-expect-error
    expect(controller.get(queryPerson, 5, state)).toBeUndefined();
    // @ts-expect-error
    () => controller.get(queryPerson, { doesnotexist: 5 }, state);
    // @ts-expect-error
    () => controller.get(queryPerson, { id: '1', doesnotexist: 5 }, state);
  });
});

describe('Snapshot.getQueryMeta()', () => {
  it('query Entity based on pk', () => {
    const controller = new Controller();
    const state = {
      ...initialState,
      entities,
    };
    const snapshot = controller.snapshot(state);
    const taco = snapshot.getQueryMeta(Tacos, { id: '1' }).data;
    expect(taco).toBeDefined();
    expect(taco).toBeInstanceOf(Tacos);
    expect(taco).toMatchSnapshot();
    const taco2 = snapshot.getQueryMeta(Tacos, { id: '2' }).data;
    expect(taco2).toBeDefined();
    expect(taco2).toBeInstanceOf(Tacos);
    expect(taco2).not.toEqual(taco);
    // should maintain referential equality
    expect(taco).toBe(snapshot.getQueryMeta(Tacos, { id: '1' }).data);

    // @ts-expect-error
    () => snapshot.getQueryMeta(Tacos, { id: { bob: 5 } });
    // @ts-expect-error
    expect(snapshot.getQueryMeta(Tacos, 5).data).toBeUndefined();
    // @ts-expect-error
    () => snapshot.getQueryMeta(Tacos, { doesnotexist: 5 });
  });
});
