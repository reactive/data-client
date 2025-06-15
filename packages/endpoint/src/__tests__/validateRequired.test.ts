// eslint-env jest
import { jest, describe, beforeAll, afterAll, it, expect } from '@jest/globals';
import { Temporal } from '@js-temporal/polyfill';
import { IDEntity } from '__tests__/new';

import SimpleMemoCache from '../schemas/__tests__/denormalize';
import Entity from '../schemas/Entity';
import validateRequired from '../validateRequired';

let dateSpy: jest.Spied<any>;
beforeAll(() => {
  dateSpy = jest

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

  static validate(processedEntity: any): string | undefined {
    return validateRequired(processedEntity, exclude(this.defaults, ['alias']));
  }
}
class MyEntity extends Entity {
  readonly name: string = '';
  readonly secondthing: string = '';
  blarb = Temporal.Instant.fromEpochMilliseconds(0);
  pk() {
    return this.name;
  }

  static schema = {
    blarb: Temporal.Instant.from,
  };

  static validate(processedEntity: any): string | undefined {
    return validateRequired(processedEntity, exclude(this.defaults, ['blarb']));
  }
}

describe(`validateRequired`, () => {
  it('should handle optional fields missing', () => {
    const schema = MyEntity;

    expect(
      new SimpleMemoCache().denormalize(schema, 'bob', {
        MyEntity: { bob: { name: 'bob', secondthing: 'hi' } },
      }),
    ).toMatchInlineSnapshot(`
      MyEntity {
        "blarb": "1970-01-01T00:00:00Z",
        "name": "bob",
        "secondthing": "hi",
      }
    `);
  });
  it('should handle optional fields found', () => {
    const schema = MyEntity;

    expect(
      new SimpleMemoCache().denormalize(schema, 'bob', {
        MyEntity: {
          bob: {
            name: 'bob',
            secondthing: 'hi',
            blarb: new Date(100000).toISOString(),
          },
        },
      }),
    ).toMatchInlineSnapshot(`
      MyEntity {
        "blarb": "1970-01-01T00:01:40Z",
        "name": "bob",
        "secondthing": "hi",
      }
    `);
  });
  it('should be invalid (suspend) with required fields missing', () => {
    const schema = MyEntity;

    const data = new SimpleMemoCache().denormalize(schema, 'bob', {
      MyEntity: {
        bob: {
          name: 'bob',
          blarb: new Date(100000).toISOString(),
        },
      },
    });
    expect(data).toEqual(expect.any(Symbol));
  });
});
