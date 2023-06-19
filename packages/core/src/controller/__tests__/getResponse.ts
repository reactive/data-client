import { Endpoint, Entity } from '@data-client/endpoint';

import { ExpiryStatus } from '../..';
import { initialState } from '../../state/reducer/createReducer';
import Contoller from '../Controller';

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

  it('denormalizes distinct schemas for null arg', () => {
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
    const { data, expiryStatus } = controller.getResponse(ep, null, state);
    expect(expiryStatus).toBe(ExpiryStatus.Valid);
    // null args means don't fill anything in
    expect(data.data).toBeUndefined();
    expect(data).toMatchInlineSnapshot(`
      {
        "data": undefined,
        "extra": "",
        "page": {
          "complex": {
            "complex": true,
            "next": false,
          },
          "first": null,
          "second": undefined,
          "third": 0,
        },
      }
    `);
    expect(controller.getResponse(ep, null, state).data).toStrictEqual(data);

    const ep2 = ep.extend({ schema: { data: Tacos, nextPage: { five: '5' } } });
    const data2 = controller.getResponse(ep2, null, state).data;
    expect(data2.data).toBeUndefined();
    expect(data2).toMatchInlineSnapshot(`
      {
        "data": undefined,
        "nextPage": {
          "five": "5",
        },
      }
    `);
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
          second: '',
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
      entityMeta: {
        Tacos: {
          1: { date: 1000000, expiresAt: 1100000, fetchedAt: 1000000 },
          2: { date: 2000000, expiresAt: 2100000, fetchedAt: 2000000 },
        },
      },
    };
    const { data, expiryStatus, expiresAt } = controller.getResponse(
      ep,
      { id: '1' },
      state,
    );
    expect(expiryStatus).toBe(ExpiryStatus.Valid);
    expect(data).toMatchSnapshot();
    expect(expiresAt).toBe(1100000);
    // test caching
    const second = controller.getResponse(ep, { id: '1' }, state);
    expect(second.data.data).toBe(data.data);
    expect(second.expiryStatus).toBe(expiryStatus);
    expect(second.expiresAt).toBe(expiresAt);
  });
});
