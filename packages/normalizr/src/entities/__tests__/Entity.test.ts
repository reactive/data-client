// eslint-env jest
import { fromJS, Record } from 'immutable';

import { denormalizeSimple as denormalize } from '../../denormalize';
import { normalize, schema, AbstractInstanceType } from '../../';
import Entity from '../Entity';
import IDEntity from '../IDEntity';
import { DELETED } from '../../special';
import WeakListMap from '../../WeakListMap';

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

const values = <T extends Record<string, any>>(obj: T) =>
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
  beforeEach(() => (warnSpy = jest.spyOn(console, 'warn')));

  test('normalizes an entity', () => {
    class MyEntity extends IDEntity {}
    expect(normalize({ id: '1' }, MyEntity)).toMatchSnapshot();
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

  it('should throw a custom error if schema key is missing from Entity', () => {
    class MyEntity extends Entity {
      readonly name: string = '';
      readonly secondthing: string = '';
      pk() {
        return this.name;
      }

      static schema = {
        blarb: Date,
      };
    }
    const schema = MyEntity;
    function normalizeBad() {
      normalize({ name: 'bob', secondthing: 'hi' }, schema);
    }
    expect(normalizeBad).toThrowErrorMatchingSnapshot();
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

  it('should only warn if at least four members are found with unexpected', () => {
    class MyEntity extends Entity {
      readonly name: string = '';
      readonly a: string = '';
      readonly b: string = '';
      readonly c: string = '';
      readonly missinga: string = '';
      readonly missingb: string = '';
      readonly missingc: string = '';
      readonly missingd: string = '';
      readonly missinge: string = '';
      readonly missingf: string = '';
      readonly missingg: string = '';
      readonly missingh: string = '';
      readonly missingi: string = '';
      readonly missingj: string = '';
      readonly missingk: string = '';
      readonly missingl: string = '';
      readonly missingm: string = '';
      readonly missingn: string = '';
      readonly missingo: string = '';
      readonly missingp: string = '';
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
        },
        schema,
      ),
    ).toMatchSnapshot();
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

  it('should throw if data loads with unexpected prop that is a getter', () => {
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
    }
    function normalizeBad() {
      normalize({ name: 'hoho', nonexistantthing: 'hi' }, MyEntity);
    }
    expect(normalizeBad).toThrow();
  });

  it('should throw if data loads with unexpected prop that is a method', () => {
    class MyEntity extends Entity {
      readonly name: string = '';
      readonly secondthing: string = '';
      readonly thirdthing: number = 0;
      readonly thirdthing2: number = 0;

      nonexistantthing() {
        return this.name + 5;
      }

      nonexistantthing2() {
        return this.name + 5;
      }

      nonexistantthing3() {
        return this.name + 5;
      }

      nonexistantthing4() {
        return this.name + 5;
      }

      pk() {
        return this.name;
      }
    }
    function normalizeBad() {
      normalize(
        {
          name: 'hoho',
          nonexistantthing: 'hi',
          nonexistantthing2: 'hi',
          nonexistantthing3: 'hi',
        },
        MyEntity,
      );
    }
    expect(normalizeBad).toThrow();
  });

  it('should throw a custom error if data loads with half unexpected props', () => {
    class MyEntity extends Entity {
      readonly name: string = '';
      readonly secondthing: string = '';
      readonly thirdthing: number = 0;
      pk() {
        return this.name;
      }
    }
    const schema = MyEntity;
    function normalizeBad() {
      normalize({ name: 'hoho', nonexistantthing: 'hi' }, schema);
    }
    expect(normalizeBad).toThrowErrorMatchingSnapshot();
  });

  it('should warn when automaticValidation === "warn"', () => {
    class MyEntity extends Entity {
      readonly name: string = '';
      readonly secondthing: string = '';
      readonly thirdthing: number = 0;
      static automaticValidation = 'warn' as const;
      pk() {
        return this.name;
      }
    }
    const schema = MyEntity;
    function normalizeBad() {
      normalize({ name: 'hoho', nonexistantthing: 'hi' }, schema);
    }
    expect(normalizeBad).not.toThrow();
    expect(warnSpy.mock.calls.length).toBe(1);
    expect(warnSpy.mock.calls).toMatchSnapshot();
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
    const schema = MyEntity;
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
      const [final] = denormalize(result, ProcessTaco, entities);
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
      const [final] = denormalize(result, ParentEntity, entities);
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
      const [final] = denormalize(result, EntriesEntity, entities);
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

    expect(denormalize('1', Menu, entities)).toMatchSnapshot();
    expect(denormalize('1', Menu, fromJS(entities))).toMatchSnapshot();

    expect(denormalize('2', Menu, entities)).toMatchSnapshot();
    expect(denormalize('2', Menu, fromJS(entities))).toMatchSnapshot();
  });

  test('denormalizes deep entities while maintaining referntial equality', () => {
    const entities = {
      Menu: {
        '1': { id: '1', food: '1' },
        '2': { id: '2' },
      },
      Food: {
        '1': { id: '1' },
      },
    };
    const entityCache = {};
    const resultCache = new WeakListMap();

    const [first] = denormalize('1', Menu, entities, entityCache, resultCache);
    const [second] = denormalize('1', Menu, entities, entityCache, resultCache);
    expect(first).toBe(second);
    expect(first?.food).toBe(second?.food);
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

  test('denormalizes to undefined for deleted data', () => {
    const entities = {
      Menu: {
        '1': { id: '1', food: '2' },
        '2': DELETED,
      },
      Food: {
        '1': { id: '1' },
        '2': DELETED,
      },
    };

    expect(denormalize('1', Menu, entities)).toMatchSnapshot();
    expect(denormalize('1', Menu, fromJS(entities))).toMatchSnapshot();

    expect(denormalize('2', Menu, entities)).toMatchSnapshot();
    expect(denormalize('2', Menu, fromJS(entities))).toMatchSnapshot();
  });

  test('denormalizes deep entities with records', () => {
    const Food = Record({ id: null });
    const MenuR = Record({ id: null, food: null });

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
        '1': { id: '1' },
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
    reports: [Report],
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

    expect(denormalize('123', Report, entities)[0]).toMatchSnapshot();
    expect(denormalize('123', Report, fromJS(entities))[0]).toMatchSnapshot();

    expect(denormalize('456', User, entities)[0]).toMatchSnapshot();
    expect(denormalize('456', User, fromJS(entities))[0]).toMatchSnapshot();
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
    const entityCache: any = {};
    const resultCache = new WeakListMap();

    const [denormalizedReport] = denormalize(
      '123',
      Report,
      entities,
      entityCache,
      resultCache,
    );

    expect(denormalizedReport).toBeDefined();
    // This is just for TypeScript, the above line actually determines this
    if (!denormalizedReport) throw new Error('expected to be defined');
    expect(denormalizedReport).toBe(denormalizedReport.draftedBy?.reports[0]);
    expect(denormalizedReport.publishedBy).toBe(denormalizedReport.draftedBy);
    expect(denormalizedReport.draftedBy?.reports[0].draftedBy).toBe(
      denormalizedReport.draftedBy,
    );
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
    console.log();

    const [denormalizedReport2] = denormalize(
      '123',
      Report,
      entities,
      entityCache,
      resultCache,
    );

    expect(denormalizedReport2).toStrictEqual(denormalizedReport);
    expect(denormalizedReport2).toBe(denormalizedReport);
    // NOTE: Given how immutable data works, referential equality can't be
    // maintained with nested denormalization.
  });

  test.only('denormalizes maintain referential equality when appropriate', () => {
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
    const entityCache: any = {};
    const resultCache = new WeakListMap();

    const input = { report: '123', comment: '999' };
    const schema = {
      report: Report,
      comment: Comment,
    };

    const [denormalizedReport] = denormalize(
      input,
      schema,
      entities,
      entityCache,
      resultCache,
    );

    expect(denormalizedReport.report).toBeDefined();
    expect(denormalizedReport.comment).toBeDefined();
    // This is just for TypeScript, the above line actually determines this
    if (!denormalizedReport.report || !denormalizedReport.comment)
      throw new Error('expected to be defined');
    expect(denormalizedReport.report.publishedBy).toBe(
      denormalizedReport.comment.author,
    );
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
    console.log();

    const [denormalizedReport2] = denormalize(
      input,
      schema,
      entities,
      entityCache,
      resultCache,
    );

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

    const [denormalizedReport3] = denormalize(
      input,
      schema,
      nextEntities,
      entityCache,
      resultCache,
    );
    expect(denormalizedReport3.comment?.author?.role).toBe('supervisor');
    expect(denormalizedReport3.report?.draftedBy?.role).toBe('supervisor');
    // NOTE: Given how immutable data works, referential equality can't be
    // maintained with nested denormalization.
  });

  describe('optional entities', () => {
    it('should be marked as found even when optional is not there', () => {
      const [denormalized, found] = denormalize('abc', WithOptional, {
        [WithOptional.key]: {
          abc: WithOptional.fromJS({
            id: 'abc',
            // this is typed because we're actually sending wrong data to it
            requiredArticle: '5' as any,
            nextPage: 'blob',
          }),
        },
        [ArticleEntity.key]: {
          ['5']: ArticleEntity.fromJS({ id: '5' }),
        },
      });
      expect(found).toBe(true);
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
      const [denormalized, found, deleted] = denormalize('abc', WithOptional, {
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
      expect(found).toBe(true);
      expect(deleted).toBe(false);
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
      const [denormalized, found, deleted] = denormalize('abc', WithOptional, {
        [WithOptional.key]: {
          abc: WithOptional.fromJS({
            id: 'abc',
            // this is typed because we're actually sending wrong data to it
            requiredArticle: '5' as any,
            nextPage: 'blob',
          }),
        },
        [ArticleEntity.key]: {
          ['5']: DELETED,
        },
      });
      expect(found).toBe(true);
      expect(deleted).toBe(true);
      const response = denormalized;
      expect(response).toBeDefined();
      expect(response).toBeInstanceOf(WithOptional);
      expect(response).toEqual({
        id: 'abc',
        article: null,
        requiredArticle: undefined,
        nextPage: 'blob',
      });
    });

    it('should be non-required deleted members should not result in deleted indicator', () => {
      const [denormalized, found, deleted] = denormalize('abc', WithOptional, {
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
          ['5']: DELETED,
          ['6']: ArticleEntity.fromJS({ id: '6' }),
        },
      });
      expect(found).toBe(true);
      expect(deleted).toBe(false);
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
      const [denormalized, found, deleted] = denormalize(
        { data: 'abc' },
        { data: WithOptional, other: ArticleEntity },
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
            ['5']: DELETED,
            ['6']: ArticleEntity.fromJS({ id: '6' }),
          },
        },
      );
      expect(found).toBe(false);
      expect(deleted).toBe(true);
      const response = denormalized;
      expect(response).toBeDefined();
      expect(response).toEqual({
        data: {
          id: 'abc',
          article: ArticleEntity.fromJS({ id: '6' }),
          requiredArticle: undefined,
          nextPage: 'blob',
        },
      });
    });
  });
});
