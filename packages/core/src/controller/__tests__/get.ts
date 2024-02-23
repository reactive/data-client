import { Entity, schema } from '@data-client/endpoint';

import { initialState } from '../../state/reducer/createReducer';
import Contoller from '../Controller';

describe('Controller.get()', () => {
  class Tacos extends Entity {
    type = '';
    id = '';
    pk() {
      return this.id;
    }
  }
  const TacoList = new schema.Collection([Tacos]);
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

  it('query Entity based on pk', () => {
    const controller = new Contoller();
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

  it('query Entity based on index', () => {
    class User extends Entity {
      id = '';
      username = '';

      pk() {
        return this.id;
      }

      static indexes = ['username'] as const;
    }

    const controller = new Contoller();
    const state = {
      ...initialState,
      entities: {
        User: {
          '1': { id: '1', username: 'bob' },
        },
      },
      indexes: {
        User: {
          username: {
            bob: '1',
          },
        },
      },
    };

    const bob = controller.get(User, { username: 'bob' }, state);
    expect(bob).toBeDefined();
    expect(bob).toBeInstanceOf(User);
    expect(bob).toMatchSnapshot();
    // should be same as id lookup
    expect(bob).toBe(controller.get(User, { id: '1' }, state));
  });

  it('query Collection based on args', () => {
    const controller = new Contoller();
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
    const controller = new Contoller();
    const state = {
      ...initialState,
      entities,
    };
    const AllTacos = new schema.All(Tacos);

    it('should get all entities', () => {
      const allTacos = controller.get(AllTacos, state);
      expect(allTacos).toBeDefined();
      expect(allTacos).toHaveLength(2);
      expect(allTacos).toMatchSnapshot();

      // TODO: @ts-expect-error (we have a hack to make this not break other things now)
      () => controller.get(AllTacos, 5, state);
    });

    // // TODO: (add infer cache)
    // it('should maintain referential equality', () => {
    //   const allTacos = controller.get(AllTacos, state);
    //   expect(allTacos).toBe(controller.get(TacoList, state));
    // });

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
    const controller = new Contoller();
    const state = {
      ...initialState,
      entities,
    };
    const queryTacos = new schema.Query(
      new schema.All(Tacos),
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
    // TODO: (add infer cache) expect(tacos).toBe(controller.get(QueryTacos, { type: 'foo' }, state));

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
    const controller = new Contoller();
    const state = {
      ...initialState,
      entities,
    };
    const tacoCount = new schema.Query(TacoList, tacos => {
      return tacos?.length ?? 0;
    });

    expect(controller.get(tacoCount, { type: 'foo' }, state)).toBe(1);
    expect(controller.get(tacoCount, { type: 'bar' }, state)).toBe(1);
    expect(controller.get(tacoCount, state)).toBe(2);
  });

  it('Union based on args', () => {
    class IDEntity extends Entity {
      id: string = '';
      pk() {
        return this.id;
      }
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
    const queryPerson = new schema.Union(
      {
        users: User,
        groups: Group,
      },
      'type',
    );
    const controller = new Contoller();
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
});
