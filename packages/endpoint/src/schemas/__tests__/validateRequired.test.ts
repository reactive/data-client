// eslint-env jest
import { IDEntity } from '__tests__/new';

import Entity from '../Entity';
import denormalize from './denormalize';
import validateRequired from '../validatRequired';

let dateSpy: jest.SpyInstance;
beforeAll(() => {
  dateSpy = jest
    // eslint-disable-next-line no-undef
    .spyOn(global.Date, 'now')
    .mockImplementation(() => new Date('2019-05-14T11:01:58.135Z').valueOf());
});
afterAll(() => {
  dateSpy.mockRestore();
});

function exclude<O extends Record<string, unknown>>(
  obj: O,
  keys: string[],
): Partial<O> {
  const r: any = {};
  Object.keys(obj).forEach(k => {
    if (!keys.includes(k)) r[k] = obj[k];
  });
  return r;
}

class Tacos extends IDEntity {
  readonly name: string = '';
  readonly alias?: string = undefined;

  protected static validate(processedEntity: any): string | undefined {
    return validateRequired(processedEntity, exclude(this.defaults, ['alias']));
  }
}
class MyEntity extends Entity {
  readonly name: string = '';
  readonly secondthing: string = '';
  readonly blarb?: Date = new Date(0);
  pk() {
    return this.name;
  }

  static schema = {
    blarb: Date,
  };

  protected static validate(processedEntity: any): string | undefined {
    return validateRequired(processedEntity, exclude(this.defaults, ['blarb']));
  }
}

describe(`validateRequired`, () => {
  it('should handle optional fields missing', () => {
    const schema = MyEntity;

    expect(
      denormalize('bob', schema, {
        MyEntity: { bob: { name: 'bob', secondthing: 'hi' } },
      }),
    ).toMatchInlineSnapshot(`
      [
        MyEntity {
          "blarb": 1970-01-01T00:00:00.000Z,
          "name": "bob",
          "secondthing": "hi",
        },
        true,
        false,
      ]
    `);
  });
  it('should handle optional fields found', () => {
    const schema = MyEntity;

    expect(
      denormalize('bob', schema, {
        MyEntity: {
          bob: {
            name: 'bob',
            secondthing: 'hi',
            blarb: new Date(100000).toISOString(),
          },
        },
      }),
    ).toMatchInlineSnapshot(`
      [
        MyEntity {
          "blarb": 1970-01-01T00:01:40.000Z,
          "name": "bob",
          "secondthing": "hi",
        },
        true,
        false,
      ]
    `);
  });
  it('should error with required fields missing', () => {
    const schema = MyEntity;

    const [data, found, suspend] = denormalize('bob', schema, {
      MyEntity: {
        bob: {
          name: 'bob',
          blarb: new Date(100000).toISOString(),
        },
      },
    });
    expect(suspend).toBe(true);
    expect(data).toBe(undefined);
  });
});
