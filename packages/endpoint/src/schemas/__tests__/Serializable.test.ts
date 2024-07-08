// eslint-env jest
import { normalize } from '@data-client/normalizr';
import { Temporal } from '@js-temporal/polyfill';
import { IDEntity } from '__tests__/new';

import SimpleMemoCache from './denormalize';

let dateSpy;
beforeAll(() => {
  dateSpy = jest
    // eslint-disable-next-line no-undef
    .spyOn(global.Date, 'now')
    .mockImplementation(() => new Date('2019-05-14T11:01:58.135Z').valueOf());
});
afterAll(() => {
  dateSpy.mockRestore();
});

class User extends IDEntity {
  createdAt = new Temporal.Instant(0n);
  name = '';
  static schema = {
    createdAt: Temporal.Instant.from,
  };
}

function Other(props: any) {
  return { defaulted: 0, ...props };
}
const objectSchema = {
  user: User,
  anotherItem: Other,
  time: Temporal.Instant.from,
};

describe(`Serializable normalization`, () => {
  test('normalizes date and custom as passthrough', () => {
    const norm = normalize(objectSchema, {
      user: {
        id: '1',
        name: 'Nacho',
        createdAt: '2020-06-07T02:00:15+0000',
      },
      anotherItem: { thing: 500 },
      time: '2020-06-07T02:00:15+0000',
    });
    expect(norm.result.time).toBe(norm.result.time);
    expect(typeof norm.result.time).toBe('string');
    expect(norm.entities[User.key]['1'].createdAt).toBe(
      norm.entities[User.key]['1'].createdAt,
    );
    expect(norm).toMatchSnapshot();
    expect(JSON.stringify(norm)).toMatchSnapshot();
  });
});

describe(`Serializable denormalization`, () => {
  test('denormalizes date and custom', () => {
    const entities = {
      User: {
        '1': {
          id: '1',
          name: 'Nacho',
          createdAt: '2020-06-07T02:00:15+0000',
        },
      },
    };
    const response = new SimpleMemoCache().denormalize(
      objectSchema,
      {
        user: '1',
        anotherItem: Other({ thing: 500 }),
        time: '2020-06-07T02:00:15+0000',
      },
      entities,
    );
    expect(response).not.toEqual(expect.any(Symbol));
    if (typeof response === 'symbol') return;
    expect(response.time.equals(response.time)).toBeTruthy();
    expect(
      response.user?.createdAt.equals(response.user?.createdAt),
    ).toBeTruthy();
    expect(response).toMatchSnapshot();
  });

  test('denormalizes as plain', () => {
    const entities = {
      User: {
        '1': {
          id: '1',
          name: 'Nacho',
          createdAt: '2020-06-07T02:00:15Z',
        },
      },
    };
    const response = new SimpleMemoCache().denormalize(
      objectSchema,
      {
        user: '1',
        anotherItem: { thing: 500 },
        time: '2020-06-07T02:00:15Z',
      },
      entities,
    );
    expect(response).not.toEqual(expect.any(Symbol));
    if (typeof response === 'symbol') return;
    expect(response.anotherItem.defaulted).toBe(0);
    expect(response.time.equals(response.time)).toBeTruthy();
    expect(
      response.user?.createdAt.equals(response.user?.createdAt),
    ).toBeTruthy();
    expect(response).toMatchSnapshot();
  });
});
