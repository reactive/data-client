// eslint-env jest
import { Entity, schema } from '@data-client/endpoint';
import { fromJS, Record, Map } from 'immutable';

import { normalize } from '..';
import { denormalize } from '../denormalize/denormalize';
import { INVALID } from '../denormalize/symbol';
import MemoCached from '../memo/MemoCache';

export function fromJSEntities(entities: {
  [k: string]: { [k: string]: any };
}) {
  return Map(entities).map(v => Map(v));
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
});
