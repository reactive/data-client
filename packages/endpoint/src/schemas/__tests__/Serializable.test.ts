// eslint-env jest
import { normalize } from '@data-client/normalizr';
import { IDEntity } from '__tests__/new';

import denormalize from './denormalize';
import { schema } from '../../';

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
  createdAt = new Date(0);
  name = '';
  static schema = {
    createdAt: Date,
  };
}
class Other {
  thing = 0;
  constructor(props) {
    this.thing = props.thing;
  }

  toJSON() {
    return { thing: this.thing };
  }
}
const objectSchema = {
  user: User,
  anotherItem: Other,
  time: Date,
};

describe(`Serializable normalization`, () => {
  test('normalizes date and custom as passthrough', () => {
    const norm = normalize(
      {
        user: {
          id: '1',
          name: 'Nacho',
          createdAt: '2020-06-07T02:00:15+0000',
        },
        anotherItem: { thing: 500 },
        time: '2020-06-07T02:00:15+0000',
      },
      objectSchema,
    );
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
          createdAt: new Date('2020-06-07T02:00:15+0000'),
        },
      },
    };
    const response = denormalize(
      {
        user: '1',
        anotherItem: new Other({ thing: 500 }),
        time: new Date('2020-06-07T02:00:15+0000'),
      },
      objectSchema,
      entities,
    );
    expect(response).not.toEqual(expect.any(Symbol));
    if (typeof response === 'symbol') return;
    expect(response.anotherItem).toBeInstanceOf(Other);
    expect(response.time.getTime()).toBe(response.time.getTime());
    expect(response.user?.createdAt.getTime()).toBe(
      response.user?.createdAt.getTime(),
    );
    expect(response).toMatchSnapshot();
  });

  test('denormalizes as plain', () => {
    const entities = {
      User: {
        '1': {
          id: '1',
          name: 'Nacho',
          createdAt: '2020-06-07T02:00:15+0000',
        },
      },
    };
    const response = denormalize(
      {
        user: '1',
        anotherItem: { thing: 500 },
        time: '2020-06-07T02:00:15+0000',
      },
      objectSchema,
      entities,
    );
    expect(response).not.toEqual(expect.any(Symbol));
    if (typeof response === 'symbol') return;
    expect(response.anotherItem).toBeInstanceOf(Other);
    expect(response.time.getTime()).toBe(response.time.getTime());
    expect(response.user?.createdAt.getTime()).toBe(
      response.user?.createdAt.getTime(),
    );
    expect(response).toMatchSnapshot();
  });
});
