// eslint-env jest
import { fromJS, Record } from 'immutable';
import { first } from 'lodash';

import { denormalizeSimple as denormalize } from '../../denormalize';
import { normalize, schema, SimpleRecord, AbstractInstanceType } from '../../';
import Entity from '../Entity';
import IDEntity from '../IDEntity';

const values = obj => Object.keys(obj).map(key => obj[key]);

class Tacos extends IDEntity {
  readonly name: string = '';
  readonly alias: string | undefined = undefined;
}

describe(`${Entity.name} normalization`, () => {
  test('normalizes an entity', () => {
    class MyEntity extends IDEntity {}
    expect(normalize({ id: 1 }, MyEntity)).toMatchSnapshot();
  });

  describe('key', () => {
    test('must be created with a key name', () => {
      const makeSchema = () =>
        class extends Entity {
          readonly id: number = 0;
          pk() {
            return `${this.id}`;
          }
        };
      expect(() => makeSchema().key).toThrow();
    });

    test('key name must be a string', () => {
      // @ts-expect-error
      class MyEntity extends IDEntity {
        static get key() {
          return 42;
        }
      }
    });

    test('key getter should return key set via `static get key()`', () => {
      class User extends IDEntity {
        static get key() {
          return 'user';
        }
      }
      expect(User.key).toEqual('user');
    });
  });

  describe('idAttribute', () => {
    test('can use a custom idAttribute string', () => {
      class User extends Entity {
        readonly idStr: string = '';
        readonly name: string = '';

        pk() {
          return this.idStr;
        }
      }
      expect(
        normalize({ idStr: '134351', name: 'Kathy' }, User.asSchema()),
      ).toMatchSnapshot();
    });

    test('can normalize entity IDs based on their object key', () => {
      class User extends Entity {
        readonly name: string = '';
        pk(parent?: any, key?: string) {
          return key;
        }
      }
      const inputSchema = new schema.Values(
        { users: User.asSchema() },
        () => 'users',
      );

      expect(
        normalize(
          { 4: { name: 'taco' }, 56: { name: 'burrito' } },
          inputSchema,
        ),
      ).toMatchSnapshot();
    });

    test("can build the entity's ID from the parent object", () => {
      class User extends Entity {
        readonly id: string = '';
        readonly name: string = '';
        pk(parent?: any, key?: string) {
          return `${parent.name}-${key}-${this.id}`;
        }
      }
      const inputSchema = new schema.Object({ user: User.asSchema() });

      expect(
        normalize(
          { name: 'tacos', user: { id: '4', name: 'Jimmy' } },
          inputSchema,
        ),
      ).toMatchSnapshot();
    });
  });

  describe('mergeStrategy', () => {
    test('defaults to plain merging', () => {
      expect(
        normalize(
          [
            { id: 1, name: 'foo' },
            { id: 1, name: 'bar', alias: 'bar' },
          ],
          [Tacos.asSchema()],
        ),
      ).toMatchSnapshot();
    });

    test('can use a custom merging strategy', () => {
      class MergeTaco extends Tacos {
        static merge<T extends typeof SimpleRecord>(
          this: T,
          first: AbstractInstanceType<T>,
          second: AbstractInstanceType<T>,
        ) {
          const props = Object.assign(
            {},
            this.toObjectDefined(first),
            this.toObjectDefined(second),
            { name: (first as MergeTaco).name },
          );
          return this.fromJS(props);
        }
      }

      expect(
        normalize(
          [
            { id: 1, name: 'foo' },
            { id: 1, name: 'bar', alias: 'bar' },
          ],
          [MergeTaco.asSchema()],
        ),
      ).toMatchSnapshot();
    });
  });

  describe('processStrategy', () => {
    test('can use a custom processing strategy', () => {
      class ProcessTaco extends Tacos {
        static fromJS<T extends typeof SimpleRecord>(
          this: T,
          props: Partial<AbstractInstanceType<T>>,
          parent?: any,
          key?: string,
        ) {
          return super.fromJS({
            ...props,
            slug: `thing-${(props as ProcessTaco).id}`,
          }) as AbstractInstanceType<T>;
        }
      }

      expect(
        normalize({ id: 1, name: 'foo' }, ProcessTaco.asSchema()),
      ).toMatchSnapshot();
    });

    test('can use information from the parent in the process strategy', () => {
      class ChildEntity extends IDEntity {
        readonly content: string = '';

        static fromJS<T extends typeof SimpleRecord>(
          this: T,
          props: Partial<AbstractInstanceType<T>>,
          parent?: any,
          key?: string,
        ) {
          return super.fromJS({
            ...props,
            parentId: parent.id,
            parentKey: key,
          }) as AbstractInstanceType<T>;
        }
      }
      class ParentEntity extends IDEntity {
        readonly content: string = '';

        static schema = { child: ChildEntity.asSchema() };
      }

      expect(
        normalize(
          {
            id: 1,
            content: 'parent',
            child: { id: 4, content: 'child' },
          },
          ParentEntity.asSchema(),
        ),
      ).toMatchSnapshot();
    });

    test('is run before and passed to the schema normalization', () => {
      class AttachmentsEntity extends IDEntity {}
      class EntriesEntity extends IDEntity {
        static schema = {
          data: { attachment: AttachmentsEntity.asSchema() },
        };

        static fromJS<T extends typeof SimpleRecord>(
          this: T,
          props: Partial<AbstractInstanceType<T>>,
          parent?: any,
          key?: string,
        ) {
          return super.fromJS({
            ...values(props)[0],
            type: Object.keys(props)[0],
          }) as AbstractInstanceType<T>;
        }
      }

      expect(
        normalize(
          { message: { id: '123', data: { attachment: { id: '456' } } } },
          EntriesEntity.asSchema(),
        ),
      ).toMatchSnapshot();
    });
  });
});

/* TODO: This isn't supported quite yet
describe(`${Entity.name} denormalization`, () => {
  test('denormalizes an entity', () => {
    const entities = {
      tacos: {
        1: { id: 1, type: 'foo' },
      },
    };
    expect(denormalize(1, Tacos.asSchema(), entities)).toMatchSnapshot();
    expect(
      denormalize(1, Tacos.asSchema(), fromJS(entities)),
    ).toMatchSnapshot();
  });

  class Food extends IDEntity {}
  class Menu extends IDEntity {
    readonly food: Food = Food.fromJS();

    static schema = { food: Food.asSchema() };
  }

  test('denormalizes deep entities', () => {
    const entities = {
      menus: {
        1: { id: 1, food: 1 },
        2: { id: 2 },
      },
      foods: {
        1: { id: 1 },
      },
    };

    expect(denormalize(1, Menu.asSchema(), entities)).toMatchSnapshot();
    expect(denormalize(1, Menu.asSchema(), fromJS(entities))).toMatchSnapshot();

    expect(denormalize(2, Menu.asSchema(), entities)).toMatchSnapshot();
    expect(denormalize(2, Menu.asSchema(), fromJS(entities))).toMatchSnapshot();
  });

  test('denormalizes to undefined for missing data', () => {
    const entities = {
      menus: {
        1: { id: 1, food: 2 },
      },
      foods: {
        1: { id: 1 },
      },
    };

    expect(denormalize(1, Menu.asSchema(), entities)).toMatchSnapshot();
    expect(denormalize(1, Menu.asSchema(), fromJS(entities))).toMatchSnapshot();

    expect(denormalize(2, Menu.asSchema(), entities)).toMatchSnapshot();
    expect(denormalize(2, Menu.asSchema(), fromJS(entities))).toMatchSnapshot();
  });

  test('denormalizes deep entities with records', () => {
    const Food = Record({ id: null });
    const MenuR = Record({ id: null, food: null });

    const entities = {
      menus: {
        1: new MenuR({ id: 1, food: 1 }),
        2: new MenuR({ id: 2 }),
      },
      foods: {
        1: new Food({ id: 1 }),
      },
    };

    expect(denormalize(1, Menu.asSchema(), entities)).toMatchSnapshot();
    expect(denormalize(1, Menu.asSchema(), fromJS(entities))).toMatchSnapshot();

    expect(denormalize(2, Menu.asSchema(), entities)).toMatchSnapshot();
    expect(denormalize(2, Menu.asSchema(), fromJS(entities))).toMatchSnapshot();
  });

  test('can denormalize already partially denormalized data', () => {
    const entities = {
      menus: {
        1: { id: 1, food: { id: 1 } },
      },
      foods: {
        1: { id: 1 },
      },
    };

    expect(denormalize(1, Menu.asSchema(), entities)).toMatchSnapshot();
    expect(denormalize(1, Menu.asSchema(), fromJS(entities))).toMatchSnapshot();
  });

  class User extends IDEntity {
    readonly role = '';
    readonly reports: Report[] = [];
  }
  class Report extends IDEntity {
    readonly title: string = '';
    readonly draftedBy: User = User.fromJS({});
    readonly publishedBy: User = User.fromJS({});

    static schema = {
      draftedBy: User,
      publishedBy: User,
    };
  }
  User.schema = {
    reports: [Report],
  };

  test('denormalizes recursive dependencies', () => {
    const entities = {
      reports: {
        '123': {
          id: '123',
          title: 'Weekly report',
          draftedBy: '456',
          publishedBy: '456',
        },
      },
      users: {
        '456': {
          id: '456',
          role: 'manager',
          reports: ['123'],
        },
      },
    };
    expect(denormalize('123', Report.asSchema(), entities)).toMatchSnapshot();
    expect(
      denormalize('123', Report.asSchema(), fromJS(entities)),
    ).toMatchSnapshot();

    expect(denormalize('456', User.asSchema(), entities)).toMatchSnapshot();
    expect(
      denormalize('456', User.asSchema(), fromJS(entities)),
    ).toMatchSnapshot();
  });

  test('denormalizes entities with referential equality', () => {
    const entities = {
      reports: {
        '123': {
          id: '123',
          title: 'Weekly report',
          draftedBy: '456',
          publishedBy: '456',
        },
      },
      users: {
        '456': {
          id: '456',
          role: 'manager',
          reports: ['123'],
        },
      },
    };

    const [denormalizedReport] = denormalize(
      '123',
      Report.asSchema(),
      entities,
    );

    expect(denormalizedReport).toBe(denormalizedReport.draftedBy.reports[0]);
    expect(denormalizedReport.publishedBy).toBe(denormalizedReport.draftedBy);

    // NOTE: Given how immutable data works, referential equality can't be
    // maintained with nested denormalization.
  });
});
*/
