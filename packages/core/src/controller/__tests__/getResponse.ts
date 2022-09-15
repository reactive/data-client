import { Endpoint, Entity } from '@rest-hooks/endpoint';

import { ExpiryStatus } from '../..';
import Contoller from '../Controller';
import { initialState } from '../../state/createReducer';

describe('Controller.getResponse()', () => {
  it('denormalizes schema with extra members but not set', () => {
    const controller = new Contoller();
    class Tacos extends Entity {
      type = '';
      id = '';
      pk() {
        return this.id;
      }
    }
    const ep = new Endpoint(() => Promise.resolve(), {
      key() {
        return 'mytest';
      },
      schema: {
        data: [Tacos],
        extra: '',
        page: {
          first: null,
          second: undefined,
          third: 0,
          complex: { complex: true, next: false },
        },
      },
    });
    const entities = {
      Tacos: {
        1: { id: '1', type: 'foo' },
        2: { id: '2', type: 'bar' },
      },
    };

    const state = {
      ...initialState,
      entities,
      results: {
        [ep.key()]: {
          data: ['1', '2'],
        },
      },
    };
    const { data, expiryStatus } = controller.getResponse(ep, state);
    expect(expiryStatus).toBe(ExpiryStatus.Valid);
    expect(data).toMatchSnapshot();
  });

  it('infers schema with extra members but not set', () => {
    const controller = new Contoller();
    class Tacos extends Entity {
      type = '';
      id = '';
      pk() {
        return this.id;
      }
    }
    const ep = new Endpoint(({ id }: { id: string }) => Promise.resolve(), {
      key({ id }) {
        return `mytest ${id}`;
      },
      schema: {
        data: Tacos,
        extra: '',
        page: {
          first: null,
          second: undefined,
          third: 0,
          complex: { complex: true, next: false },
        },
      },
    });
    const entities = {
      Tacos: {
        1: { id: '1', type: 'foo' },
        2: { id: '2', type: 'bar' },
      },
    };

    const state = {
      ...initialState,
      entities,
    };
    const { data, expiryStatus } = controller.getResponse(
      ep,
      { id: '1' },
      state,
    );
    expect(expiryStatus).toBe(ExpiryStatus.Valid);
    expect(data).toMatchSnapshot();
  });
});
