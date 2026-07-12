// eslint-env jest
import { Entity, schema, Scalar } from '@data-client/endpoint';
import { fromJS, Record, Map } from 'immutable';

import { normalize } from '..';
import { denormalize } from '../denormalize/denormalize.imm';

export function fromJSEntities(entities: {
  [k: string]: { [k: string]: any };
}) {
  return Map(entities).map(v => Map(v));
}
export function fromJSState(state: {
  entities: {
    [k: string]: { [k: string]: any };
  };
  indexes: {
    [k: string]: { [k: string]: { [field: string]: string } };
  };
}) {
  return {
    entities: fromJSEntities(state.entities),
    indexes: fromJS(state.indexes),
  };
}

class IDEntity extends Entity {
  id = '';
  pk(parent, key) {
    return this.id || key;
  }
}

class Tacos extends IDEntity {
  type = '';
}

let dateSpy;
beforeAll(() => {
  dateSpy = jest
    .spyOn(global.Date, 'now')
    .mockImplementation(() => new Date('2019-05-14T11:01:58.135Z').valueOf());
});
afterAll(() => {
  dateSpy.mockRestore();
});

describe('immutableJS', () => {
  class Food extends schema.EntityMixin(
    class {
      id = '';
    },
  ) {}
  class MenuData {
    id = '';
    food = Food.fromJS();
  }
  class Menu extends schema.EntityMixin(MenuData, {
    schema: { food: Food },
  }) {}

  test('can normalize', () => {
    const state = fromJS({
      entities: { Food: {}, Menu: {} },
    });
    const v = normalize(Menu, {
      id: '1',
      food: { id: '1', extra: 'hi' },
    });
    // console.log(v);
    const entities = state.mergeDeep(fromJS(v.entities));
    // console.log(entities.getIn(['Menu', '1']));

    // expect(denormalize(Menu, '1', entities)).toMatchSnapshot();
    // expect(denormalize(Menu, '1', fromJS(entities))).toMatchSnapshot();
  });

  test('can denormalize already partially denormalized data', () => {
    const entities = Map({
      Menu: Map({
        1: { id: '1', food: { id: '1' } },
      }),
      Food: Map({
        // TODO: BREAKING CHANGE: Update this to use main entity and only return nested as 'fallback' in case main entity is not set
        1: { id: '1', extra: 'hi' },
      }),
    });

    expect(denormalize(Menu, '1', entities)).toMatchSnapshot();
  });

  test('denormalizes deep entities with records', () => {
    const Food = Record<{ id: null | string }>({ id: null });
    const MenuR = Record<{ id: null | string; food: null | string }>({
      id: null,
      food: null,
    });

    const entities = {
      Menu: {
        '1': new MenuR({ id: '1', food: '1' }),
        '2': new MenuR({ id: '2' }),
      },
      Food: {
        '1': new Food({ id: '1' }),
      },
    };

    expect(denormalize(Menu, '1', fromJSEntities(entities))).toMatchSnapshot();

    expect(denormalize(Menu, '2', fromJSEntities(entities))).toMatchSnapshot();
  });

  test('propagates the exact invalid symbol through immutable object inputs', () => {
    // consolidation of the drifted ImmutableUtils copies resolved on
    // *propagating* the first symbol (not collapsing to a package-local
    // INVALID) so identity checks work across package boundaries
    const INVALID_TACO = Symbol('ENTITY WAS INVALID');
    const entities = Map({ Tacos: Map({ '1': INVALID_TACO as any }) });
    expect(denormalize({ data: Tacos }, fromJS({ data: '1' }), entities)).toBe(
      INVALID_TACO,
    );
  });

  test('denormalizes args-dependent schemas (Scalar argsKey path)', () => {
    class Company extends IDEntity {
      price = 0;
      pct_equity = 0;
      static key = 'Company';
    }
    const PortfolioScalar = new Scalar({
      lens: (args: readonly any[]) => args[0]?.portfolio,
      key: 'portfolio',
      entity: Company,
    });
    Company.schema = { pct_equity: PortfolioScalar } as any;

    const args = [{ portfolio: 'portfolioA' }];
    const state = normalize(
      [Company],
      [{ id: '1', price: 100, pct_equity: 0.5 }],
      args,
    );

    const result = denormalize(
      [Company],
      state.result,
      fromJSEntities(state.entities),
      args,
    ) as any[];

    expect(result[0].price).toBe(100);
    // without args threaded through LocalCache, the lens resolves to
    // undefined and the scalar field denormalizes to undefined
    expect(result[0].pct_equity).toBe(0.5);
  });
});
