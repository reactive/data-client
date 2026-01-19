// eslint-env jest
import { normalize, INVALID } from '@data-client/normalizr';
import { denormalize as plainDenormalize } from '@data-client/normalizr';
import { denormalize as immDenormalize } from '@data-client/normalizr/imm';
import { Temporal } from '@js-temporal/polyfill';

import { SimpleMemoCache, fromJSEntities } from './denormalize';
import { schema, EntityMixin, Values } from '../..';

let dateSpy: jest.Spied<any>;
beforeAll(() => {
  dateSpy = jest

    .spyOn(global.Date, 'now')
    .mockImplementation(() => new Date('2019-05-14T11:01:58.135Z').valueOf());
});
afterAll(() => {
  dateSpy.mockRestore();
});

const values = <T extends { [k: string]: any }>(obj: T) =>
  Object.keys(obj).map(key => obj[key]);

class TacoData {
  id = '';
  name = '';
  alias: string | undefined = undefined;
}
class Tacos extends EntityMixin(TacoData) {}

class ArticleData {
  readonly id: string = '';
  readonly title: string = '';
  readonly author: string = '';
  readonly content: string = '';
}
class ArticleEntity extends EntityMixin(ArticleData) {}

class OptionalData {
  readonly id: string = '';
  readonly article: ArticleEntity | null = null;
  readonly requiredArticle = ArticleEntity.fromJS();
  readonly nextPage: string = '';
}
class WithOptional extends EntityMixin(OptionalData, {
  schema: {
    article: ArticleEntity,
    requiredArticle: ArticleEntity,
  },
}) {}

class IDData {
  id = '';
}

describe(`${schema.Entity.name} construction`, () => {
  describe('pk', () => {
    it('should use provided pk if part of class', () => {
      class MyData {
        username = '';
        title = '';
        pk() {
          return this.username;
        }
      }
      const MyEntity = EntityMixin(MyData);
      expect(MyEntity.pk({ username: 'bob' })).toBe('bob');
      const entity = MyEntity.fromJS({ username: 'bob' });
      expect(entity.pk()).toBe('bob');
      // @ts-expect-error
      entity.lksdfl;
    });
    it('should use pk overide in Entity', () => {
      class MyData {
        username = '';
        title = '';
        pk() {
          return this.username;
        }
      }
      class MyEntity extends EntityMixin(MyData) {
        pk() {
          return this.title;
        }
      }
      expect(MyEntity.pk({ title: 'hi' })).toBe('hi');
      expect(MyEntity.fromJS({ title: 'hi' }).pk()).toBe('hi');
    });
    it('should use pk overide in Entity when base is set via options', () => {
      class MyData {
        username = '';
        title = '';
      }
      class MyEntity extends EntityMixin(MyData, { pk: 'username' }) {
        pk() {
          return this.title;
        }
      }
      expect(MyEntity.pk({ title: 'hi' })).toBe('hi');
      expect(MyEntity.fromJS({ title: 'hi' }).pk()).toBe('hi');
    });
    it('should use pk field names', () => {
      class MyData {
        username = '';
        title = '';
      }
      class MyEntity extends EntityMixin(MyData, { pk: 'username' }) {}
      expect(MyEntity.pk({ username: 'bob' })).toBe('bob');
      expect(MyEntity.fromJS({ username: 'bob' }).pk()).toBe('bob');
    });
    it('should use pk function option', () => {
      class MyData {
        username = '';
        title = '';
      }
      class MyEntity extends EntityMixin(MyData, {
        pk(v) {
          //@ts-expect-error
          v.sdlfkjsd;
          return v.username;
        },
      }) {}
      expect(MyEntity.pk({ username: 'bob' })).toBe('bob');
      expect(MyEntity.fromJS({ username: 'bob' }).pk()).toBe('bob');
    });
    it('should fail with bad pk field name', () => {
      class MyData {
        username = '';
        title = '';
      }
      // @ts-expect-error
      class MyEntity extends EntityMixin(MyData, { pk: 'id' }) {}
      // @ts-expect-error
      expect(MyEntity.pk({ username: 'bob' })).toBeUndefined();
      // @ts-expect-error
      expect(MyEntity.fromJS({ username: 'bob' }).pk()).toBeUndefined();
    });
    it('should fail with no id and pk unspecified', () => {
      class MyData {
        username = '';
        title = '';
      }
      // @ts-expect-error
      class MyEntity extends EntityMixin(MyData) {}
      // @ts-expect-error
      expect(MyEntity.pk({ username: 'bob' })).toBeUndefined();
      // @ts-expect-error
      expect(MyEntity.fromJS({ username: 'bob' }).pk()).toBeUndefined();
      expect(() =>
        normalize(MyEntity, { username: 'bob' }),
      ).toThrowErrorMatchingSnapshot();
    });
    it('should use id field if no pk specified', () => {
      class MyData {
        id = '';
        username = '';
        title = '';
      }
      class MyEntity extends EntityMixin(MyData) {}
      expect(MyEntity.pk({ id: '5' })).toBe('5');
      expect(MyEntity.fromJS({ id: '5' }).pk()).toBe('5');
    });
  });
  describe('key', () => {
    it('should use class name with no key in options', () => {
      class MyData {
        id = '';
        username = '';
        title = '';
      }
      const MyEntity = EntityMixin(MyData);
      expect(MyEntity.key).toBe('MyData');
    });
    it('should error with no discernable name', () => {
      const MyEntity = EntityMixin(
        class {
          id = '';
          username = '';
          title = '';
        },
      );
      expect(() => MyEntity.key).toThrowErrorMatchingInlineSnapshot(`
        "Entity classes without a name must define \`static key\`
        See: https://dataclient.io/rest/api/Entity#key"
      `);
    });
    it('should use entity class name with no key in options', () => {
      class MyData {
        id = '';
        username = '';
        title = '';
      }
      class MyEntity extends EntityMixin(MyData) {}
      expect(MyEntity.key).toBe('MyEntity');
    });
    it('should use key in options', () => {
      class MyData {
        id = '';
        username = '';
        title = '';
      }
      const MyEntity = EntityMixin(MyData, { key: 'MYKEY' });
      expect(MyEntity.key).toBe('MYKEY');
      class MyEntity2 extends EntityMixin(MyData, { key: 'MYKEY' }) {}
      expect(MyEntity2.key).toBe('MYKEY');
    });
    it('should use static key in base class', () => {
      class MyData {
        id = '';
        username = '';
        title = '';

        static key = 'MYKEY';
      }
      const MyEntity = EntityMixin(MyData);
      expect(MyEntity.key).toBe('MYKEY');
    });
    it('should have options.key override base class', () => {
      class MyData {
        id = '';
        username = '';
        title = '';

        static key = 'MYKEY';
      }
      const MyEntity = EntityMixin(MyData, { key: 'OVERRIDE' });
      expect(MyEntity.key).toBe('OVERRIDE');
    });
    it('static key in Entity should override options', () => {
      class MyData {
        id = '';
        username = '';
        title = '';
      }
      class MyEntity extends EntityMixin(MyData, { key: 'OPTIONSKEY' }) {
        static key = 'STATICKEY';
      }
      expect(MyEntity.key).toBe('STATICKEY');
    });
  });
  describe('schema', () => {
    it('options.schema should set schema', () => {
      class MyData {
        id = '';
        username = '';
        title = '';
        createdAt = Temporal.Instant.fromEpochMilliseconds(0);
      }
      class MyEntity extends EntityMixin(MyData, {
        schema: { createdAt: Temporal.Instant.from },
      }) {}
      expect(MyEntity.schema).toEqual({ createdAt: Temporal.Instant.from });
    });
    it('options.schema should override base schema', () => {
      class MyData {
        id = '';
        username = '';
        title = '';
        createdAt = Temporal.Instant.fromEpochMilliseconds(0);
        static schema = {
          user: Temporal.Instant.from,
        };
      }
      class MyEntity extends EntityMixin(MyData, {
        schema: { createdAt: Temporal.Instant.from },
      }) {}
      expect(MyEntity.schema).toEqual({ createdAt: Temporal.Instant.from });
    });
    it('static schema in base should be used', () => {
      class MyData {
        id = '';
        username = '';
        title = '';
        createdAt = Temporal.Instant.fromEpochMilliseconds(0);
        static schema = {
          createdAt: Temporal.Instant.from,
        };
      }
      class MyEntity extends EntityMixin(MyData) {}
      expect(MyEntity.schema).toEqual({ createdAt: Temporal.Instant.from });
    });
    it('static schema in Entity should override options', () => {
      class MyData {
        id = '';
        username = '';
        title = '';
        createdAt = Temporal.Instant.fromEpochMilliseconds(0);
      }
      class MyEntity extends EntityMixin(MyData, {
        schema: { createdAt: Temporal.Instant.from },
      }) {
        static schema = {
          user: Temporal.Instant.from,
        };
      }
      expect(MyEntity.schema).toEqual({ user: Temporal.Instant.from });
    });
  });
});

describe(`${schema.Entity.name} normalization`, () => {
  let warnSpy: jest.Spied<typeof console.warn>;
  afterEach(() => {
    warnSpy.mockRestore();
  });
  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  test('normalizes an entity', () => {
    class MyEntity extends EntityMixin(IDData) {}
    expect(normalize(MyEntity, { id: '1' })).toMatchSnapshot();
  });

  test('normalizes already processed entities', () => {
    class MyEntity extends EntityMixin(IDData) {}
    class MyData {
      id = '';
      title = '';
      nest = MyEntity.fromJS();
    }
    class Nested extends EntityMixin(MyData, {
      schema: {
        nest: MyEntity,
      },
    }) {}

    expect(normalize(new schema.Array(MyEntity), ['1'])).toMatchSnapshot();
    expect(
      normalize(new schema.Object({ data: MyEntity }), { data: '1' }),
    ).toMatchSnapshot();
    expect(
      normalize(Nested, { title: 'hi', id: '5', nest: '10' }),
    ).toMatchSnapshot();
  });

  test('normalizes does not change value when shouldUpdate() returns false', () => {
    class MyData {
      id = '';
      title = '';
    }
    class MyEntity extends EntityMixin(MyData) {
      static shouldUpdate() {
        return false;
      }
    }
    const { entities, entitiesMeta } = normalize(MyEntity, {
      id: '1',
      title: 'hi',
    });
    const secondEntities = normalize(
      MyEntity,
      { id: '1', title: 'second' },
      [],
      { entities, entitiesMeta, indexes: {} },
    ).entities;
    expect(entities.MyEntity['1']).toBeDefined();
    expect(entities.MyEntity['1']).toBe(secondEntities.MyEntity['1']);
  });

  it('should throw a custom error if data does not include pk', () => {
    class MyData {
      name = '';
      secondthing = '';
    }
    const MyEntity = EntityMixin(MyData, { pk: 'name' });

    function normalizeBad() {
      normalize(MyEntity, { secondthing: 'hi' });
    }
    expect(normalizeBad).toThrowErrorMatchingSnapshot();

    // @ts-expect-error
    EntityMixin(MyData, { pk: 'sdfasd' });
  });

  it('should not throw if schema key is missing from Entity', () => {
    class MyData {
      name = '';
      secondthing = '';
    }
    // @ts-expect-error
    const MyEntity = EntityMixin(MyData, {
      pk: 'name',
      schema: {
        blarb: Temporal.Instant.from,
      },
    });

    expect(
      normalize(MyEntity, { name: 'bob', secondthing: 'hi' }),
    ).toMatchSnapshot();
  });

  it('should handle optional schema entries Entity', () => {
    class MyData {
      readonly name: string = '';
      readonly secondthing: string = '';
      readonly blarb: Date | undefined = undefined;
    }
    class MyEntity extends EntityMixin(MyData, {
      pk: 'name',
      schema: {
        blarb: Temporal.Instant.from,
      },
    }) {}

    expect(normalize(MyEntity, { name: 'bob', secondthing: 'hi' }))
      .toMatchInlineSnapshot(`
      {
        "entities": {
          "MyEntity": {
            "bob": {
              "name": "bob",
              "secondthing": "hi",
            },
          },
        },
        "entitiesMeta": {
          "MyEntity": {
            "bob": {
              "date": 1557831718135,
              "expiresAt": Infinity,
              "fetchedAt": 0,
            },
          },
        },
        "indexes": {},
        "result": "bob",
      }
    `);
  });

  it('should throw a custom error if data loads with no matching props', () => {
    class MyData {
      name = '';
      secondthing = '';
    }
    const MyEntity = EntityMixin(MyData, { pk: 'name' });
    function normalizeBad() {
      normalize(MyEntity, {});
    }
    expect(normalizeBad).toThrowErrorMatchingSnapshot();
  });

  it('should throw a custom error loads with array', () => {
    class MyData {
      name = '';
      secondthing = '';
    }
    const MyEntity = EntityMixin(MyData, { pk: 'name' });
    function normalizeBad() {
      normalize(MyEntity, [
        { name: 'hi', secondthing: 'ho' },
        { name: 'hi', secondthing: 'ho' },
        { name: 'hi', secondthing: 'ho' },
      ]);
    }
    expect(normalizeBad).toThrowErrorMatchingSnapshot();
  });

  it('should error if no matching keys are found', () => {
    class MyData {
      readonly name: string = '';
    }
    // @ts-expect-error
    class MyEntity extends EntityMixin(MyData, { pk: 'e' }) {}

    expect(() =>
      normalize(MyEntity, {
        name: 0,
      }),
    ).toThrowErrorMatchingSnapshot();
  });

  it('should allow many unexpected as long as none are missing', () => {
    class MyData {
      readonly name: string = '';
      readonly a: string = '';
    }
    class MyEntity extends EntityMixin(MyData, { pk: 'name' }) {}

    expect(
      normalize(MyEntity, {
        name: 'hi',
        a: 'a',
        b: 'b',
        c: 'c',
        d: 'e',
        e: 0,
        f: 0,
        g: 0,
        h: 0,
        i: 0,
        j: 0,
        k: 0,
        l: 0,
        m: 0,
        n: 0,
        o: 0,
        p: 0,
        q: 0,
        r: 0,
        s: 0,
        t: 0,
        u: 0,
      }),
    ).toMatchSnapshot();
    expect(warnSpy.mock.calls.length).toBe(0);
  });

  it('should not expect getters returned', () => {
    class MyData {
      readonly name: string = '';
      get other() {
        return this.name + 5;
      }

      get another() {
        return 'another';
      }

      get yetAnother() {
        return 'another2';
      }
    }
    class MyEntity extends EntityMixin(MyData, { pk: 'name' }) {}
    function normalizeBad() {
      normalize(MyEntity, { name: 'bob' });
    }
    expect(normalizeBad).not.toThrow();
    expect(warnSpy.mock.calls.length).toBe(0);
  });

  it('should throw a custom error if data loads with string', () => {
    class MyData {
      readonly name: string = '';
      readonly secondthing: string = '';
      readonly thirdthing: number = 0;
      pk() {
        return this.name;
      }
    }
    const MyEntity = EntityMixin(MyData);
    function normalizeBad() {
      normalize({ data: MyEntity }, 'hibho');
    }
    expect(normalizeBad).toThrowErrorMatchingSnapshot();
  });

  describe('key', () => {
    test('key name must be a string', () => {
      class MyData {
        id = '';
      }
      // @ts-expect-error
      class MyEntity extends EntityMixin(MyData) {
        static get key() {
          return 42;
        }
      }
    });
  });

  describe('pk()', () => {
    test('can use a custom pk() string', () => {
      class User {
        readonly idStr: string = '';
        readonly name: string = '';
      }
      const UserEntity = EntityMixin(User, { pk: 'idStr' });
      expect(
        normalize(UserEntity, { idStr: '134351', name: 'Kathy' }),
      ).toMatchSnapshot();
    });

    test('can normalize entity IDs based on their object key', () => {
      class User {
        readonly name: string = '';
      }
      const UserEntity = EntityMixin(User, {
        pk(value, parent, key) {
          return key;
        },
      });

      const inputSchema = new Values({ users: UserEntity }, () => 'users');

      expect(
        normalize(inputSchema, {
          '4': { name: 'taco' },
          '56': { name: 'burrito' },
        }),
      ).toMatchSnapshot();
    });

    test("can build the entity's ID from the parent object", () => {
      class User {
        readonly id: string = '';
        readonly name: string = '';
      }
      const UserEntity = EntityMixin(User, {
        pk(value, parent, key) {
          return `${parent.name}-${key}-${value.id}`;
        },
      });

      const inputSchema = new schema.Object({ user: UserEntity });

      expect(
        normalize(inputSchema, {
          name: 'tacos',
          user: { id: '4', name: 'Jimmy' },
        }),
      ).toMatchSnapshot();
    });
  });

  describe('mergeStrategy', () => {
    test('defaults to plain merging', () => {
      expect(
        normalize(
          [Tacos],
          [
            { id: '1', name: 'foo' },
            { id: '1', name: 'bar', alias: 'bar' },
          ],
        ),
      ).toMatchSnapshot();
    });

    test('can use a custom merging strategy', () => {
      class MergeTaco extends Tacos {
        static merge(existing: any, incoming: any) {
          const props = Object.assign({}, existing, incoming, {
            name: (existing as MergeTaco).name,
          });
          return this.fromJS(props);
        }
      }

      expect(
        normalize(
          [MergeTaco],
          [
            { id: '1', name: 'foo' },
            { id: '1', name: 'bar', alias: 'bar' },
          ],
        ),
      ).toMatchSnapshot();
    });
  });

  describe('process', () => {
    test('can use a custom processing strategy', () => {
      class ProcessTaco extends Tacos {
        readonly slug: string = '';
        static process(input: any, parent: any, key: string | undefined): any {
          return {
            ...input,
            slug: `thing-${(input as unknown as ProcessTaco).id}`,
          };
        }
      }
      const { entities, result } = normalize(ProcessTaco, {
        id: '1',
        name: 'foo',
      });
      const final = plainDenormalize(ProcessTaco, result, entities);
      expect(final).not.toEqual(expect.any(Symbol));
      if (typeof final === 'symbol') return;
      expect(final?.slug).toEqual('thing-1');
      expect(final).toMatchSnapshot();
    });

    test('can use information from the parent in the process strategy', () => {
      class Child {
        id = '';
        readonly content: string = '';
        readonly parentId: string = '';
        readonly parentKey: string = '';
      }
      class ChildEntity extends EntityMixin(Child) {
        static process(input: any, parent: any, key: string | undefined): any {
          return {
            ...input,
            parentId: parent?.id,
            parentKey: key,
          };
        }
      }
      class Parent {
        id = '';
        readonly content: string = '';
        readonly child: ChildEntity = ChildEntity.fromJS({});
      }
      const ParentEntity = EntityMixin(Parent, {
        schema: { child: ChildEntity },
      });

      const { entities, result } = normalize(ParentEntity, {
        id: '1',
        content: 'parent',
        child: { id: '4', content: 'child' },
      });
      const final = plainDenormalize(ParentEntity, result, entities);
      expect(final).not.toEqual(expect.any(Symbol));
      if (typeof final === 'symbol') return;
      expect(final?.child?.parentId).toEqual('1');
      expect(final).toMatchSnapshot();
    });

    describe('schema denormalization', () => {
      class AttachmentsEntity extends EntityMixin(
        class {
          id = '';
        },
      ) {}
      expect(AttachmentsEntity.key).toBe('AttachmentsEntity');
      class Entries {
        id = '';
        readonly type: string = '';
        data = { attachment: undefined };
      }
      class EntriesEntity extends EntityMixin(Entries) {
        static schema = {
          data: { attachment: AttachmentsEntity },
        };

        static process(input: any, parent: any, key: string | undefined): any {
          return {
            ...values(input)[0],
            type: Object.keys(input)[0],
          };
        }
      }
      class EntriesEntity2 extends EntityMixin(Entries, {
        schema: {
          data: { attachment: AttachmentsEntity },
        },
        process(input, parent, key) {
          return {
            ...values(input)[0],
            type: Object.keys(input)[0],
          };
        },
      }) {}

      it.each([EntriesEntity, EntriesEntity2])(
        'is run before and passed to the schema denormalization %s',
        EntriesEntity => {
          const { entities, result } = normalize(EntriesEntity, {
            message: { id: '123', data: { attachment: { id: '456' } } },
          });
          const final = plainDenormalize(EntriesEntity, result, entities);
          expect(final).not.toEqual(expect.any(Symbol));
          if (typeof final === 'symbol') return;
          expect(final?.type).toEqual('message');
          expect(final).toMatchSnapshot();
        },
      );
    });
  });
});

describe(`${schema.Entity.name} denormalization`, () => {
  test('denormalizes an entity', () => {
    const entities = {
      Tacos: {
        '1': { id: '1', name: 'foo' },
      },
    };
    expect(plainDenormalize(Tacos, '1', entities)).toMatchSnapshot();
    expect(
      immDenormalize(Tacos, '1', fromJSEntities(entities)),
    ).toMatchSnapshot();
  });

  class Food extends EntityMixin(
    class {
      id = '';
    },
  ) {}
  class MenuData {
    id = '';
    readonly food: Food = Food.fromJS();
  }
  class Menu extends EntityMixin(MenuData, { schema: { food: Food } }) {}

  test('denormalizes deep entities', () => {
    const entities = {
      Menu: {
        '1': { id: '1', food: '1' },
        '2': { id: '2' },
      },
      Food: {
        '1': { id: '1' },
      },
    };

    const de1 = plainDenormalize(Menu, '1', entities);
    expect(de1).toMatchSnapshot();
    expect(immDenormalize(Menu, '1', fromJSEntities(entities))).toEqual(de1);

    const de2 = plainDenormalize(Menu, '2', entities);
    expect(de2).toMatchSnapshot();
    expect(immDenormalize(Menu, '2', fromJSEntities(entities))).toEqual(de2);
  });

  test('denormalizes deep entities while maintaining referential equality', () => {
    const entities = {
      Menu: {
        '1': { id: '1', food: '1' },
        '2': { id: '2' },
      },
      Food: {
        '1': { id: '1' },
      },
    };
    const memo = new SimpleMemoCache();

    const first = memo.denormalize(Menu, '1', entities);
    const second = memo.denormalize(Menu, '1', entities);
    expect(first).not.toEqual(expect.any(Symbol));
    if (typeof first === 'symbol') return;
    expect(second).not.toEqual(expect.any(Symbol));
    if (typeof second === 'symbol') return;
    expect(first).toBe(second);
    expect(first?.food).toBe(second?.food);
  });

  test('denormalizes to undefined when validate() returns string', () => {
    class MyTacos extends Tacos {
      static validate(entity: any) {
        if (!Object.hasOwn(entity, 'name')) return 'no name';
      }
    }
    const entities = {
      MyTacos: {
        '1': { id: '1' },
      },
    };
    expect(plainDenormalize(MyTacos, '1', entities)).toEqual(
      expect.any(Symbol),
    );
    expect(immDenormalize(MyTacos, '1', fromJSEntities(entities))).toEqual(
      expect.any(Symbol),
    );
  });

  test('denormalizes to undefined for missing data', () => {
    const entities = {
      Menu: {
        '1': { id: '1', food: '2' },
      },
      Food: {
        '1': { id: '1' },
      },
    };

    expect(plainDenormalize(Menu, '1', entities)).toMatchSnapshot();
    expect(
      immDenormalize(Menu, '1', fromJSEntities(entities)),
    ).toMatchSnapshot();

    expect(plainDenormalize(Menu, '2', entities)).toMatchSnapshot();
    expect(
      immDenormalize(Menu, '2', fromJSEntities(entities)),
    ).toMatchSnapshot();
  });

  it('should handle optional schema entries Entity', () => {
    class MyData {
      readonly name: string = '';
      readonly secondthing: string = '';
      readonly blarb: Date | undefined = undefined;
    }
    class MyEntity extends EntityMixin(MyData, {
      pk: 'name',
      schema: { blarb: Temporal.Instant.from },
    }) {}

    expect(
      plainDenormalize(MyEntity, 'bob', {
        MyEntity: { bob: { name: 'bob', secondthing: 'hi' } },
      }),
    ).toMatchInlineSnapshot(`
        MyEntity {
          "blarb": undefined,
          "name": "bob",
          "secondthing": "hi",
        }
      `);
  });

  it('should handle null schema entries Entity', () => {
    class MyData {
      readonly name: string = '';
      readonly secondthing: string = '';
      readonly blarb: Date | null = null;
    }
    class MyEntity extends EntityMixin(MyData, {
      pk: 'name',
      schema: { blarb: Temporal.Instant.from },
    }) {}

    expect(
      plainDenormalize(MyEntity, 'bob', {
        MyEntity: { bob: { name: 'bob', secondthing: 'hi', blarb: null } },
      }),
    ).toMatchInlineSnapshot(`
        MyEntity {
          "blarb": null,
          "name": "bob",
          "secondthing": "hi",
        }
      `);
  });

  test('denormalizes to undefined for deleted data', () => {
    const entities = {
      Menu: {
        '1': { id: '1', food: '2' },
        '2': INVALID,
      },
      Food: {
        '1': { id: '1' },
        '2': INVALID,
      },
    };

    expect(plainDenormalize(Menu, '1', entities)).toMatchSnapshot();
    expect(
      immDenormalize(Menu, '1', fromJSEntities(entities)),
    ).toMatchSnapshot();

    expect(plainDenormalize(Menu, '2', entities)).toMatchSnapshot();
    expect(
      immDenormalize(Menu, '2', fromJSEntities(entities)),
    ).toMatchSnapshot();
  });

  test('can denormalize already partially denormalized data', () => {
    const entities = {
      Menu: {
        '1': { id: '1', food: { id: '1' } },
      },
      Food: {
        // TODO: BREAKING CHANGE: Update this to use main entity and only return nested as 'fallback' in case main entity is not set
        '1': { id: '1', extra: 'hi' },
      },
    };

    expect(plainDenormalize(Menu, '1', entities)).toMatchSnapshot();
    expect(
      immDenormalize(Menu, '1', fromJSEntities(entities)),
    ).toMatchSnapshot();
  });

  describe('nesting', () => {
    class UserData {
      id = '';
      readonly role = '';
      readonly reports: Report[] = [];
    }
    class User extends EntityMixin(UserData) {}
    class ReportData {
      id = '';
      readonly title: string = '';
      readonly draftedBy: User = User.fromJS();
      readonly publishedBy: User = User.fromJS();
    }
    class Report extends EntityMixin(ReportData, {
      schema: {
        draftedBy: User,
        publishedBy: User,
      },
    }) {}
    User.schema = {
      reports: new schema.Array(Report),
    };
    class CommentData {
      id = '';
      readonly body: string = '';
      readonly author: User = User.fromJS();
    }
    class Comment extends EntityMixin(CommentData, {
      schema: { author: User },
    }) {}

    test('denormalizes recursive dependencies', () => {
      const entities = {
        Report: {
          '123': {
            id: '123',
            title: 'Weekly report',
            draftedBy: '456',
            publishedBy: '456',
          },
        },
        User: {
          '456': {
            id: '456',
            role: 'manager',
            reports: ['123'],
          },
        },
      };

      expect(plainDenormalize(Report, '123', entities)).toMatchSnapshot();
      expect(
        immDenormalize(Report, '123', fromJSEntities(entities)),
      ).toMatchSnapshot();

      expect(plainDenormalize(User, '456', entities)).toMatchSnapshot();
      expect(
        immDenormalize(User, '456', fromJSEntities(entities)),
      ).toMatchSnapshot();
    });

    test('denormalizes recursive entities with referential equality', () => {
      const entities = {
        Report: {
          '123': {
            id: '123',
            title: 'Weekly report',
            draftedBy: '456',
            publishedBy: '456',
          },
        },
        Comment: {
          '999': {
            id: '999',
            body: 'Good morning',
            author: '456',
          },
        },
        User: {
          '456': {
            id: '456',
            role: 'manager',
            reports: ['123'],
          },
          '457': {
            id: '457',
            role: 'servant',
            reports: ['123'],
          },
        },
      };
      const memo = new SimpleMemoCache();

      const denormalizedReport = memo.denormalize(Report, '123', entities);
      expect(denormalizedReport).not.toEqual(expect.any(Symbol));
      if (typeof denormalizedReport === 'symbol') return;

      expect(denormalizedReport).toBeDefined();
      // This is just for TypeScript, the above line actually determines this
      if (!denormalizedReport) throw new Error('expected to be defined');
      expect(denormalizedReport).toBe(denormalizedReport.draftedBy?.reports[0]);
      expect(denormalizedReport.publishedBy).toBe(denormalizedReport.draftedBy);
      expect(denormalizedReport.draftedBy?.reports[0].draftedBy).toBe(
        denormalizedReport.draftedBy,
      );

      const denormalizedReport2 = memo.denormalize(Report, '123', entities);
      expect(denormalizedReport2).not.toEqual(expect.any(Symbol));
      if (typeof denormalizedReport2 === 'symbol') return;

      expect(denormalizedReport2).toStrictEqual(denormalizedReport);
      expect(denormalizedReport2).toBe(denormalizedReport);
      // NOTE: Given how immutable data works, referential equality can't be
      // maintained with nested denormalization.
    });

    test('denormalizes maintain referential equality when appropriate', () => {
      const entities = {
        Report: {
          '123': {
            id: '123',
            title: 'Weekly report',
            draftedBy: '456',
            publishedBy: '456',
          },
        },
        Comment: {
          '999': {
            id: '999',
            body: 'Good morning',
            author: '456',
          },
        },
        User: {
          '456': {
            id: '456',
            role: 'manager',
            reports: ['123'],
          },
          '457': {
            id: '457',
            role: 'servant',
            reports: ['123'],
          },
        },
      };
      const memo = new SimpleMemoCache();

      const input = { report: '123', comment: '999' };
      const sch = new schema.Object({
        report: Report,
        comment: Comment,
      });

      const denormalizedReport = memo.denormalize(sch, input, entities);
      expect(denormalizedReport).not.toEqual(expect.any(Symbol));
      if (typeof denormalizedReport === 'symbol') return;

      expect(denormalizedReport.report).toBeDefined();
      expect(denormalizedReport.comment).toBeDefined();
      // This is just for TypeScript, the above line actually determines this
      if (!denormalizedReport.report || !denormalizedReport.comment)
        throw new Error('expected to be defined');
      expect(denormalizedReport.report.publishedBy).toBe(
        denormalizedReport.comment.author,
      );

      const denormalizedReport2 = memo.denormalize(sch, input, entities);
      expect(denormalizedReport2).not.toEqual(expect.any(Symbol));
      if (typeof denormalizedReport2 === 'symbol') return;

      expect(denormalizedReport2).toStrictEqual(denormalizedReport);
      expect(denormalizedReport2).toBe(denormalizedReport);

      // should update all uses of user
      const nextEntities = {
        ...entities,
        User: {
          ...entities.User,
          '456': {
            ...entities.User[456],
            role: 'supervisor',
          },
        },
      };

      const denormalizedReport3 = memo.denormalize(sch, input, nextEntities);
      expect(denormalizedReport3).not.toEqual(expect.any(Symbol));
      if (typeof denormalizedReport3 === 'symbol') return;

      expect(denormalizedReport3.comment?.author?.role).toBe('supervisor');
      expect(denormalizedReport3.report?.draftedBy?.role).toBe('supervisor');
      // NOTE: Given how immutable data works, referential equality can't be
      // maintained with nested denormalization.
    });

    describe('optional entities', () => {
      it('should be marked as found even when optional is not there', () => {
        const denormalized = plainDenormalize(WithOptional, 'abc', {
          [WithOptional.key]: {
            abc: {
              id: 'abc',
              // this is typed because we're actually sending wrong data to it
              requiredArticle: '5' as any,
              nextPage: 'blob',
            },
          },
          [ArticleEntity.key]: {
            ['5']: { id: '5' },
          },
        });
        const response = denormalized;
        expect(response).toBeDefined();
        expect(response).toBeInstanceOf(WithOptional);
        expect(response).toEqual({
          id: 'abc',
          article: null,
          requiredArticle: ArticleEntity.fromJS({ id: '5' }),
          nextPage: 'blob',
        });
      });

      it('should be marked as found when nested entity is missing', () => {
        const denormalized = plainDenormalize(WithOptional, 'abc', {
          [WithOptional.key]: {
            abc: WithOptional.fromJS({
              id: 'abc',
              // this is typed because we're actually sending wrong data to it
              article: '5' as any,
              nextPage: 'blob',
            }),
          },
          [ArticleEntity.key]: {
            ['5']: ArticleEntity.fromJS({ id: '5' }),
          },
        });
        expect(denormalized).not.toEqual(expect.any(Symbol));
        if (typeof denormalized === 'symbol') return;

        const response = denormalized;
        expect(response).toBeDefined();
        expect(response).toBeInstanceOf(WithOptional);
        expect(response).toEqual({
          id: 'abc',
          article: ArticleEntity.fromJS({ id: '5' }),
          requiredArticle: ArticleEntity.fromJS(),
          nextPage: 'blob',
        });
      });

      it('should be marked as deleted when required entity is deleted symbol', () => {
        const denormalized = plainDenormalize(WithOptional, 'abc', {
          [WithOptional.key]: {
            abc: {
              id: 'abc',
              // this is typed because we're actually sending wrong data to it
              requiredArticle: '5' as any,
              nextPage: 'blob',
            },
          },
          [ArticleEntity.key]: {
            ['5']: INVALID,
          },
        });
        expect(denormalized).toEqual(expect.any(Symbol));
      });

      it('should be non-required deleted members should not result in deleted indicator', () => {
        const denormalized = plainDenormalize(WithOptional, 'abc', {
          [WithOptional.key]: {
            abc: WithOptional.fromJS({
              id: 'abc',
              // this is typed because we're actually sending wrong data to it
              article: '5' as any,
              requiredArticle: '6' as any,
              nextPage: 'blob',
            }),
          },
          [ArticleEntity.key]: {
            ['5']: INVALID,
            ['6']: ArticleEntity.fromJS({ id: '6' }),
          },
        });
        expect(denormalized).not.toEqual(expect.any(Symbol));
        if (typeof denormalized === 'symbol') return;
        const response = denormalized;
        expect(response).toBeDefined();
        expect(response).toBeInstanceOf(WithOptional);
        expect(response).toEqual({
          id: 'abc',
          article: undefined,
          requiredArticle: ArticleEntity.fromJS({ id: '6' }),
          nextPage: 'blob',
        });
      });

      it('should be both deleted and not found when both are true in different parts of schema', () => {
        const denormalized = plainDenormalize(
          new schema.Object({ data: WithOptional, other: ArticleEntity }),
          { data: 'abc' },
          {
            [WithOptional.key]: {
              abc: WithOptional.fromJS({
                id: 'abc',
                // this is typed because we're actually sending wrong data to it
                article: '6' as any,
                requiredArticle: '5' as any,
                nextPage: 'blob',
              }),
            },
            [ArticleEntity.key]: {
              ['5']: INVALID,
              ['6']: ArticleEntity.fromJS({ id: '6' }),
            },
          },
        );
        expect(denormalized).toEqual(expect.any(Symbol));
      });
    });
  });
});

describe('Entity.defaults', () => {
  it('should work with inheritance', () => {
    abstract class DefaultsEntity extends EntityMixin(
      class {
        id = '';
      },
    ) {
      static getMyDefaults() {
        return this.defaults;
      }
    }

    class ID extends DefaultsEntity {
      id = '';
      pk() {
        return this.id;
      }
    }
    class UserEntity extends ID {
      username = '';
      createdAt = Temporal.Instant.fromEpochMilliseconds(0);

      static schema = {
        createdAt: Temporal.Instant.from,
      };
    }

    expect(ID.getMyDefaults()).toMatchInlineSnapshot(`
      ID {
        "id": "",
      }
    `);
    expect(UserEntity.getMyDefaults()).toMatchInlineSnapshot(`
      UserEntity {
        "createdAt": "1970-01-01T00:00:00Z",
        "id": "",
        "username": "",
      }
    `);
  });
});
