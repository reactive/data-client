// eslint-env jest
import { normalize, denormalize } from '@data-client/normalizr';
import { INVALID } from '@data-client/normalizr';
import { Temporal } from '@js-temporal/polyfill';
import { IDEntity } from '__tests__/new';
import { fromJS, Record } from 'immutable';

import { SimpleMemoCache } from './denormalize';
import { AbstractInstanceType } from '../../';
import { schema } from '../../';
import Entity from '../Entity';

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

const values = <T extends { [k: string]: any }>(obj: T) =>
  Object.keys(obj).map(key => obj[key]);

class Tacos extends IDEntity {
  readonly name: string = '';
  readonly alias: string | undefined = undefined;
}

class ArticleEntity extends Entity {
  readonly id: string = '';
  readonly title: string = '';
  readonly author: string = '';
  readonly content: string = '';
  pk() {
    return this.id;
  }
}

class WithOptional extends Entity {
  readonly id: string = '';
  readonly article: ArticleEntity | null = null;
  readonly requiredArticle = ArticleEntity.fromJS();
  readonly nextPage: string = '';

  pk() {
    return this.id;
  }

  static schema = {
    article: ArticleEntity,
    requiredArticle: ArticleEntity,
  };
}

describe(`${Entity.name} normalization`, () => {
  let warnSpy: jest.SpyInstance;
  afterEach(() => {
    warnSpy.mockRestore();
  });
  beforeEach(() =>
    (warnSpy = jest.spyOn(console, 'warn')).mockImplementation(() => {}),
  );

  test('normalizes an entity', () => {
    class MyEntity extends IDEntity {}
    expect(normalize({ id: '1' }, MyEntity)).toMatchSnapshot();
  });

  test('normalizes already processed entities', () => {
    class MyEntity extends IDEntity {}
    class Nested extends IDEntity {
      title = '';
      nest = MyEntity.fromJS();
      static schema = {
        nest: MyEntity,
      };
    }
    expect(normalize(['1'], new schema.Array(MyEntity))).toMatchSnapshot();
    expect(
      normalize({ data: '1' }, new schema.Object({ data: MyEntity })),
    ).toMatchSnapshot();
    expect(
      normalize({ title: 'hi', id: '5', nest: '10' }, Nested),
    ).toMatchSnapshot();
  });

  test('normalizes does not change value when shouldUpdate() returns false', () => {
    class MyEntity extends IDEntity {
      id = '';
      title = '';
      static shouldUpdate() {
        return false;
      }
    }

    const { entities, entityMeta } = normalize(
      { id: '1', title: 'hi' },
      MyEntity,
    );
    const secondEntities = normalize(
      { id: '1', title: 'second' },
      MyEntity,
      [],
      entities,
      {},
      entityMeta,
    ).entities;
    expect(entities.MyEntity['1']).toBeDefined();
    expect(entities.MyEntity['1']).toBe(secondEntities.MyEntity['1']);
  });

  it('should throw a custom error if data does not include pk', () => {
    class MyEntity extends Entity {
      readonly name: string = '';
      readonly secondthing: string = '';
      pk() {
        return this.name;
      }
    }
    const schema = MyEntity;
    function normalizeBad() {
      normalize({ secondthing: 'hi' }, schema);
    }
    expect(normalizeBad).toThrowErrorMatchingSnapshot();
  });

  it('should throw a custom error if data does not include pk (serializes pk)', () => {
    class MyEntity extends Entity {
      readonly name: string = '';
      readonly secondthing: string = '';
      pk() {
        return `${this.name}`;
      }
    }
    const schema = MyEntity;
    function normalizeBad() {
      normalize({ secondthing: 'hi' }, schema);
    }
    expect(normalizeBad).toThrowErrorMatchingSnapshot();
  });

  it('should not throw if schema key is missing from Entity', () => {
    class MyEntity extends Entity {
      readonly name: string = '';
      readonly secondthing: string = '';
      pk() {
        return this.name;
      }

      static schema = {
        blarb: Temporal.Instant.from,
      };
    }
    const schema = MyEntity;

    expect(
      normalize({ name: 'bob', secondthing: 'hi' }, schema),
    ).toMatchSnapshot();
  });

  it('should handle optional schema entries Entity', () => {
    class MyEntity extends Entity {
      readonly name: string = '';
      readonly secondthing: string = '';
      readonly blarb: Date | undefined = undefined;
      pk() {
        return this.name;
      }

      static schema = {
        blarb: Temporal.Instant.from,
      };
    }
    const schema = MyEntity;

    expect(normalize({ name: 'bob', secondthing: 'hi' }, schema))
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
        "entityMeta": {
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
    class MyEntity extends Entity {
      readonly name: string = '';
      readonly secondthing: string = '';
      pk() {
        return this.name;
      }
    }
    const schema = MyEntity;
    function normalizeBad() {
      normalize({}, schema);
    }
    expect(normalizeBad).toThrowErrorMatchingSnapshot();
  });

  it('should throw a custom error loads with array', () => {
    class MyEntity extends Entity {
      readonly name: string = '';
      readonly secondthing: string = '';
      pk() {
        return this.name;
      }
    }
    const schema = MyEntity;
    function normalizeBad() {
      normalize(
        [
          { name: 'hi', secondthing: 'ho' },
          { name: 'hi', secondthing: 'ho' },
          { name: 'hi', secondthing: 'ho' },
        ],
        schema,
      );
    }
    expect(normalizeBad).toThrowErrorMatchingSnapshot();
  });

  it('should warn when automaticValidation === "warn"', () => {
    class MyEntity extends Entity {
      readonly '0': string = '';
      readonly secondthing: string = '';
      static automaticValidation = 'warn' as const;
      pk() {
        return this[0];
      }
    }
    const schema = MyEntity;
    function normalizeBad() {
      normalize(
        [
          { name: 'hi', secondthing: 'ho' },
          { name: 'hi', secondthing: 'ho' },
          { name: 'hi', secondthing: 'ho' },
        ],
        schema,
      );
    }
    expect(normalizeBad).not.toThrow();
    expect(warnSpy.mock.calls.length).toBe(1);
    expect(warnSpy.mock.calls).toMatchSnapshot();
  });

  it('should allow many unexpected as long as none are missing', () => {
    class MyEntity extends Entity {
      readonly name: string = '';
      readonly a: string = '';
      pk() {
        return this.name;
      }
    }
    const schema = MyEntity;

    expect(
      normalize(
        {
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
        },
        schema,
      ),
    ).toMatchSnapshot();
    expect(warnSpy.mock.calls.length).toBe(0);
  });

  it('should throw with custom validator', () => {
    class MyEntity extends Entity {
      readonly name: string = '';
      readonly secondthing: string = '';
      readonly thirdthing: number = 0;

      get nonexistantthing() {
        return this.name + 5;
      }

      pk() {
        return this.name;
      }

      static validate(value: any) {
        if (value.nonexistantthing) return 'should not contain getter';
      }
    }
    function normalizeBad() {
      normalize({ name: 'hoho', nonexistantthing: 'hi' }, MyEntity);
    }
    expect(normalizeBad).toThrow();
  });

  it('should not expect getters returned', () => {
    class MyEntity extends Entity {
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

      pk() {
        return this.name;
      }
    }
    function normalizeBad() {
      normalize({ name: 'bob' }, MyEntity);
    }
    expect(normalizeBad).not.toThrow();
    expect(warnSpy.mock.calls.length).toBe(0);
  });

  it('should do nothing when automaticValidation === "silent"', () => {
    class MyEntity extends Entity {
      readonly name: string = '';
      readonly secondthing: string = '';
      readonly thirdthing: number = 0;
      static automaticValidation = 'silent' as const;
      pk() {
        return this.name;
      }
    }
    const schema = MyEntity;
    function normalizeBad() {
      normalize({ name: 'hoho', nonexistantthing: 'hi' }, schema);
    }
    expect(normalizeBad).not.toThrow();
    expect(warnSpy.mock.calls.length).toBe(0);
  });

  it('should throw a custom error if data loads with string', () => {
    class MyEntity extends Entity {
      readonly name: string = '';
      readonly secondthing: string = '';
      readonly thirdthing: number = 0;
      pk() {
        return this.name;
      }
    }
    const schema = { data: MyEntity };
    function normalizeBad() {
      normalize('hibho', schema);
    }
    expect(normalizeBad).toThrowErrorMatchingSnapshot();
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

  describe('pk()', () => {
    test('can use a custom pk() string', () => {
      class User extends Entity {
        readonly idStr: string = '';
        readonly name: string = '';

        pk() {
          return this.idStr;
        }
      }
      expect(
        normalize({ idStr: '134351', name: 'Kathy' }, User),
      ).toMatchSnapshot();
    });

    test('can normalize entity IDs based on their object key', () => {
      class User extends Entity {
        readonly name: string = '';
        pk(parent?: any, key?: string) {
          return key;
        }
      }
      const inputSchema = new schema.Values({ users: User }, () => 'users');

      expect(
        normalize(
          { '4': { name: 'taco' }, '56': { name: 'burrito' } },
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
      const inputSchema = new schema.Object({ user: User });

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
            { id: '1', name: 'foo' },
            { id: '1', name: 'bar', alias: 'bar' },
          ],
          [Tacos],
        ),
      ).toMatchSnapshot();
    });

    test('can use a custom merging strategy', () => {
      class MergeTaco extends Tacos {
        static merge<T extends typeof Entity>(
          this: T,
          existing: AbstractInstanceType<T>,
          incoming: AbstractInstanceType<T>,
        ) {
          const props = Object.assign({}, existing, incoming, {
            name: (existing as MergeTaco).name,
          });
          return this.fromJS(props);
        }
      }

      expect(
        normalize(
          [
            { id: '1', name: 'foo' },
            { id: '1', name: 'bar', alias: 'bar' },
          ],
          [MergeTaco],
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
      const { entities, result } = normalize(
        { id: '1', name: 'foo' },
        ProcessTaco,
      );
      const final = new SimpleMemoCache().denormalize(
        result,
        ProcessTaco,
        entities,
      );
      expect(final).not.toEqual(expect.any(Symbol));
      if (typeof final === 'symbol') return;
      expect(final?.slug).toEqual('thing-1');
      expect(final).toMatchSnapshot();
    });

    test('can use information from the parent in the process strategy', () => {
      class ChildEntity extends IDEntity {
        readonly content: string = '';
        readonly parentId: string = '';
        readonly parentKey: string = '';

        static process(input: any, parent: any, key: string | undefined): any {
          return {
            ...input,
            parentId: parent?.id,
            parentKey: key,
          };
        }
      }
      class ParentEntity extends IDEntity {
        readonly content: string = '';
        readonly child: ChildEntity = ChildEntity.fromJS({});

        static schema = { child: ChildEntity };
      }

      const { entities, result } = normalize(
        {
          id: '1',
          content: 'parent',
          child: { id: '4', content: 'child' },
        },
        ParentEntity,
      );
      const final = new SimpleMemoCache().denormalize(
        result,
        ParentEntity,
        entities,
      );
      expect(final).not.toEqual(expect.any(Symbol));
      if (typeof final === 'symbol') return;
      expect(final?.child?.parentId).toEqual('1');
      expect(final).toMatchSnapshot();
    });

    test('is run before and passed to the schema denormalization', () => {
      class AttachmentsEntity extends IDEntity {}
      class EntriesEntity extends IDEntity {
        readonly type: string = '';

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

      const { entities, result } = normalize(
        { message: { id: '123', data: { attachment: { id: '456' } } } },
        EntriesEntity,
      );
      const final = new SimpleMemoCache().denormalize(
        result,
        EntriesEntity,
        entities,
      );
      expect(final).not.toEqual(expect.any(Symbol));
      if (typeof final === 'symbol') return;
      expect(final?.type).toEqual('message');
      expect(final).toMatchSnapshot();
    });
  });
});

describe(`${Entity.name} denormalization`, () => {
  test('denormalizes an entity', () => {
    const entities = {
      Tacos: {
        '1': { id: '1', name: 'foo' },
      },
    };
    expect(denormalize('1', Tacos, entities)).toMatchSnapshot();
    expect(denormalize('1', Tacos, fromJS(entities))).toMatchSnapshot();
  });

  class Food extends IDEntity {}
  class Menu extends IDEntity {
    readonly food: Food = Food.fromJS();

    static schema = { food: Food };
  }

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

    const de1 = denormalize('1', Menu, entities);
    expect(de1).toMatchSnapshot();
    expect(denormalize('1', Menu, fromJS(entities))).toEqual(de1);

    const de2 = denormalize('2', Menu, entities);
    expect(de2).toMatchSnapshot();
    expect(denormalize('2', Menu, fromJS(entities))).toEqual(de2);
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

    const first = memo.denormalize('1', Menu, entities);
    const second = memo.denormalize('1', Menu, entities);
    expect(first).not.toEqual(expect.any(Symbol));
    if (typeof first === 'symbol') return;
    expect(second).not.toEqual(expect.any(Symbol));
    if (typeof second === 'symbol') return;
    expect(first).toBe(second);
    expect(first?.food).toBe(second?.food);
  });

  test('denormalizes to undefined when validate() returns string', () => {
    class MyTacos extends Tacos {
      static validate(entity) {
        if (!Object.hasOwn(entity, 'name')) return 'no name';
      }
    }
    const entities = {
      MyTacos: {
        '1': { id: '1' },
      },
    };
    expect(denormalize('1', MyTacos, entities)).toEqual(expect.any(Symbol));
    expect(denormalize('1', MyTacos, fromJS(entities))).toEqual(
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

    expect(denormalize('1', Menu, entities)).toMatchSnapshot();
    expect(denormalize('1', Menu, fromJS(entities))).toMatchSnapshot();

    expect(denormalize('2', Menu, entities)).toMatchSnapshot();
    expect(denormalize('2', Menu, fromJS(entities))).toMatchSnapshot();
  });

  it('should handle optional schema entries Entity', () => {
    class MyEntity extends Entity {
      readonly name: string = '';
      readonly secondthing: string = '';
      readonly blarb: Date | undefined = undefined;
      pk() {
        return this.name;
      }

      static schema = {
        blarb: Temporal.Instant.from,
      };
    }
    const schema = MyEntity;

    expect(
      denormalize('bob', schema, {
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
    class MyEntity extends Entity {
      readonly name: string = '';
      readonly secondthing: string = '';
      readonly blarb: Date | null = null;
      pk() {
        return this.name;
      }

      static schema = {
        blarb: Temporal.Instant.from,
      };
    }
    const schema = MyEntity;

    expect(
      denormalize('bob', schema, {
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

    expect(denormalize('1', Menu, entities)).toMatchSnapshot();
    expect(denormalize('1', Menu, fromJS(entities))).toMatchSnapshot();

    expect(denormalize('2', Menu, entities)).toMatchSnapshot();
    expect(denormalize('2', Menu, fromJS(entities))).toMatchSnapshot();
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

    expect(denormalize('1', Menu, entities)).toMatchSnapshot();
    expect(denormalize('1', Menu, fromJS(entities))).toMatchSnapshot();

    expect(denormalize('2', Menu, entities)).toMatchSnapshot();
    expect(denormalize('2', Menu, fromJS(entities))).toMatchSnapshot();
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

    expect(denormalize('1', Menu, entities)).toMatchSnapshot();
    expect(denormalize('1', Menu, fromJS(entities))).toMatchSnapshot();
  });

  class User extends IDEntity {
    readonly role = '';
    readonly reports: Report[] = [];
  }
  class Report extends IDEntity {
    readonly title: string = '';
    readonly draftedBy: User = User.fromJS();
    readonly publishedBy: User = User.fromJS();

    static schema = {
      draftedBy: User,
      publishedBy: User,
    };
  }
  User.schema = {
    reports: new schema.Array(Report),
  };
  class Comment extends IDEntity {
    readonly body: string = '';
    readonly author: User = User.fromJS();

    static schema = {
      author: User,
    };
  }

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

    expect(denormalize('123', Report, entities)).toMatchSnapshot();
    expect(denormalize('123', Report, fromJS(entities))).toMatchSnapshot();

    expect(denormalize('456', User, entities)).toMatchSnapshot();
    expect(denormalize('456', User, fromJS(entities))).toMatchSnapshot();
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

    const denormalizedReport = memo.denormalize('123', Report, entities);
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

    const denormalizedReport2 = memo.denormalize('123', Report, entities);

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

    const denormalizedReport = memo.denormalize(input, sch, entities);
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

    const denormalizedReport2 = memo.denormalize(input, sch, entities);
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

    const denormalizedReport3 = memo.denormalize(input, sch, nextEntities);
    expect(denormalizedReport3).not.toEqual(expect.any(Symbol));
    if (typeof denormalizedReport3 === 'symbol') return;

    expect(denormalizedReport3.comment?.author?.role).toBe('supervisor');
    expect(denormalizedReport3.report?.draftedBy?.role).toBe('supervisor');
    // NOTE: Given how immutable data works, referential equality can't be
    // maintained with nested denormalization.
  });

  describe('optional entities', () => {
    it('should be marked as found even when optional is not there', () => {
      const denormalized = denormalize('abc', WithOptional, {
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
      const denormalized = denormalize('abc', WithOptional, {
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
      const denormalized = denormalize('abc', WithOptional, {
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
      const denormalized = denormalize('abc', WithOptional, {
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

    it('should be deleted when both are true in different parts of schema', () => {
      const denormalized = denormalize(
        { data: 'abc' },
        new schema.Object({ data: WithOptional, other: ArticleEntity }),
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
      /*const response = denormalized;
      expect(response).toBeDefined();
      expect(response).toEqual({
        data: {
          id: 'abc',
          article: ArticleEntity.fromJS({ id: '6' }),
          requiredArticle: undefined,
          nextPage: 'blob',
        },
      });
      deleted symbol replaces whole denorm value
      */
    });
  });
});

describe('Entity.defaults', () => {
  it('should work with inheritance', () => {
    abstract class DefaultsEntity extends Entity {
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
      createdAt = Temporal.Instant.fromEpochSeconds(0);

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
