// eslint-env jest
import { Entity } from '@data-client/endpoint';
import { schema as schemas } from '@data-client/endpoint';
import {
  UnionResource,
  CoolerArticle,
  IndexedUser,
  FirstUnion,
} from '__tests__/new';

import { fromJSState } from './immutable.test';
import { IQueryDelegate } from '../interface';
import { BaseDelegate } from '../memo/Delegate';
import { DelegateImmutable } from '../memo/Delegate.immutable';
import MemoCache from '../memo/MemoCache';

class IDEntity extends Entity {
  id = '';
  pk() {
    return this.id;
  }
}

class Tacos extends IDEntity {
  type = '';
}

let dateSpy;
beforeAll(() => {
  dateSpy = jest

    .spyOn(global.Date, 'now')
    .mockImplementation(() => new Date('2019-05-14T11:01:58.135Z').valueOf());
});
afterAll(() => {
  dateSpy.mockRestore();
});

describe('MemoCache', () => {
  describe('denormalize', () => {
    test('denormalizes suspends when symbol contains DELETED string', () => {
      const entities = {
        Tacos: {
          1: Symbol('ENTITY WAS DELETED'),
        },
      };
      expect(new MemoCache().denormalize(Tacos, '1', entities).data).toEqual(
        expect.any(Symbol),
      );
    });
    test('maintains referential equality with same results', () => {
      const memo = new MemoCache();
      const entities = {
        Tacos: {
          1: { id: '1', type: 'foo' },
          2: { id: '2', type: 'bar' },
        },
      };
      const result = ['1', '2'];
      const schema = [Tacos];
      const { data: first, paths: pathsFirst } = memo.denormalize(
        schema,
        result,
        entities,
      );
      const { data: second, paths: pathsSecond } = memo.denormalize(
        schema,
        result,
        entities,
      );
      expect(first).toBe(second);
      expect(pathsFirst).toEqual(pathsSecond);

      const { data: third } = memo.denormalize(schema, [...result], entities);
      expect(first).not.toBe(third);
      expect(first).toEqual(third);

      const fourth = memo.denormalize(schema, result, {
        Tacos: { ...entities.Tacos, 2: { id: '2', type: 'bar' } },
      }).data;
      expect(first).not.toBe(fourth);
      expect(first).toEqual(fourth);
    });
    test('updates when results change, but entities are the same', () => {
      const memo = new MemoCache();
      const entities = {
        Tacos: {
          1: { id: '1', type: 'foo' },
          2: { id: '2', type: 'bar' },
        },
      };
      const result = { data: ['1', '2'], nextPage: 'initial' };
      const schema = { data: [Tacos], nextPage: '' };
      const { data: first, paths } = memo.denormalize(schema, result, entities);
      const { data: second, paths: pathsSecond } = memo.denormalize(
        schema,
        { ...result, nextPage: 'second' },
        entities,
      );
      if (typeof first === 'symbol' || typeof second === 'symbol')
        throw new Error();
      expect(first.nextPage).toBe('initial');
      expect(second.nextPage).toBe('second');
      expect(first.data).toEqual(second.data);
      if (!first.data || !second.data) throw Error();
      for (let i = 0; i < first.data?.length; i++) {
        expect(first.data[i]).toBe(second.data[i]);
      }

      const { data: fourth, paths: fourthPaths } = memo.denormalize(
        schema,
        result,
        {
          Tacos: { ...entities.Tacos, 2: { id: '2', type: 'bar' } },
        },
      );
      if (typeof fourth === 'symbol' || !fourth.data) throw new Error();

      expect(first).not.toBe(fourth);
      expect(first).toEqual(fourth);
      expect(first.data[0]).toBe(fourth.data[0]);
    });

    describe('nested entities', () => {
      class User extends IDEntity {
        name = '';
      }
      class Comment extends IDEntity {
        comment = '';
        user = User.fromJS();
        static schema = {
          user: User,
        };
      }
      class Article extends IDEntity {
        title = '';
        body = '';
        author = User.fromJS();
        comments: Comment[] = [];
        static schema = {
          author: User,
          comments: [Comment],
        };
      }

      const entities = {
        Article: {
          123: {
            author: '8472',
            body: 'This article is great.',
            comments: ['comment-123-4738'],
            id: '123',
            title: 'A Great Article',
          },
        },
        Comment: {
          'comment-123-4738': {
            comment: 'I like it!',
            id: 'comment-123-4738',
            user: '10293',
          },
        },
        User: {
          10293: {
            id: '10293',
            name: 'Jane',
          },
          8472: {
            id: '8472',
            name: 'Paul',
          },
        },
      };

      test('maintains referential equality with nested entities', () => {
        const memo = new MemoCache();

        const result = { data: '123' };
        const schema = { data: Article };
        const first = memo.denormalize(schema, result, entities).data;
        const second = memo.denormalize(schema, result, entities).data;
        expect(first).toBe(second);
        const third = memo.denormalize(Article, '123', entities).data;
        const fourth = memo.denormalize(Article, '123', entities).data;
        expect(third).toBe(fourth);
      });

      test('maintains responds to entity updates for distinct top-level results', () => {
        const memo = new MemoCache();

        const result1 = { data: '123' };
        const result2 = { results: ['123'] };
        const first = memo.denormalize(
          { data: Article },
          result1,
          entities,
        ).data;
        const second = memo.denormalize(
          { results: [Article] },
          result2,
          entities,
        ).data;
        if (
          typeof first === 'symbol' ||
          typeof second === 'symbol' ||
          !second.results
        )
          throw new Error();
        expect(first.data).toBe(second.results[0]);
        const third = memo.denormalize(Article, '123', entities).data;
        expect(third).toBe(first.data);

        // now change
        const nextState = {
          ...entities,
          Article: {
            123: {
              ...entities.Article[123],
              title: 'updated article',
              body: 'new body',
            },
          },
        };
        const firstChanged = memo.denormalize(
          { data: Article },
          result1,
          nextState,
        ).data;
        expect(firstChanged).not.toBe(first);
        const secondChanged = memo.denormalize(
          { results: [Article] },
          result2,
          nextState,
        ).data;
        expect(secondChanged).not.toBe(second);
        if (
          typeof firstChanged === 'symbol' ||
          typeof secondChanged === 'symbol'
        )
          throw new Error('symbol');
        expect(firstChanged.data).toBe(secondChanged.results?.[0]);
      });

      test('handles multi-schema (summary entities)', () => {
        class ArticleSummary extends IDEntity {
          title = '';
          body = '';
          author = '';
          static schema = {
            comments: [Comment],
          };

          static key = 'Article';
        }
        const memo = new MemoCache();

        // we have different result values to represent different endpoint inputs
        const resultA = { data: '123' };
        const resultB = { data: '123' };
        const resultC = '123';
        const firstSchema = { data: ArticleSummary };
        const secondSchema = { data: Article };
        const first = memo.denormalize(firstSchema, resultA, entities).data;
        const second = memo.denormalize(secondSchema, resultB, entities).data;
        if (
          typeof first === 'symbol' ||
          typeof second === 'symbol' ||
          !second.data ||
          !first.data
        )
          throw new Error();
        // show distinction between how they are denormalized
        expect(first.data.author).toMatchInlineSnapshot(`"8472"`);
        expect(second.data.author).toMatchInlineSnapshot(`
            User {
              "id": "8472",
              "name": "Paul",
            }
          `);
        expect(first.data).not.toBe(second.data);
        const firstWithoutChange = memo.denormalize(
          firstSchema,
          resultA,
          entities,
        ).data;
        expect(first).toBe(firstWithoutChange);

        const third = memo.denormalize(Article, resultC, entities).data;
        expect(third).toBe(second.data);

        // now change
        const nextState = {
          ...entities,
          Article: {
            123: {
              ...entities.Article[123],
              title: 'updated article',
              body: 'new body',
            },
          },
        };
        const firstChanged = memo.denormalize(
          firstSchema,
          resultA,
          nextState,
        ).data;
        expect(firstChanged).not.toBe(first);
        const secondChanged = memo.denormalize(
          secondSchema,
          resultB,
          nextState,
        ).data;
        expect(secondChanged).not.toBe(second);
        if (
          typeof firstChanged === 'symbol' ||
          typeof secondChanged === 'symbol' ||
          !firstChanged.data ||
          !secondChanged.data
        )
          throw new Error();
        expect(firstChanged.data.author).toMatchInlineSnapshot(`"8472"`);
        expect(secondChanged.data.author).toMatchInlineSnapshot(`
            User {
              "id": "8472",
              "name": "Paul",
            }
          `);
      });

      test('entity equality changes', () => {
        const memo = new MemoCache();

        const result = { data: '123' };
        const { data: first } = memo.denormalize(
          { data: Article },
          result,
          entities,
        );
        const { data: second } = memo.denormalize({ data: Article }, result, {
          ...entities,
          Article: {
            123: {
              author: '8472',
              body: 'This article is great.',
              comments: ['comment-123-4738'],
              id: '123',
              title: 'A Great Article',
            },
          },
        });
        expect(first).not.toBe(second);
        if (
          typeof first === 'symbol' ||
          typeof second === 'symbol' ||
          !second.data ||
          !first.data
        )
          throw new Error();
        expect(first.data.author).toBe(second.data.author);
        expect(first.data.comments[0]).toBe(second.data.comments[0]);
      });

      test('nested entity equality changes', () => {
        const memo = new MemoCache();

        const result = { data: '123' };
        const { data: first } = memo.denormalize(
          { data: Article },
          result,
          entities,
        );

        const { data: second } = memo.denormalize({ data: Article }, result, {
          ...entities,
          Comment: {
            'comment-123-4738': {
              comment: 'Updated comment!',
              id: 'comment-123-4738',
              user: '10293',
            },
          },
        });

        expect(first).not.toBe(second);
        if (
          typeof first === 'symbol' ||
          typeof second === 'symbol' ||
          !second.data ||
          !first.data
        )
          throw new Error();
        expect(first.data.title).toBe(second.data.title);
        expect(first.data.author).toBe(second.data.author);
        expect(second.data.comments[0].comment).toEqual('Updated comment!');
        expect(first.data.comments[0]).not.toBe(second.data.comments[0]);
        expect(first.data.comments[0].user).toBe(second.data.comments[0].user);
      });

      test('nested entity becomes present in entity table', () => {
        const memo = new MemoCache();

        const result = { data: '123' };
        const emptyEntities = {
          ...entities,
          // no Users exist
          User: {},
        };
        const { data: first } = memo.denormalize(
          { data: Article },
          result,
          emptyEntities,
        );

        const { data: second } = memo.denormalize(
          { data: Article },
          result,
          emptyEntities,
        );

        const { data: third } = memo.denormalize(
          { data: Article },
          result,
          // now has users
          entities,
        );

        if (
          typeof first === 'symbol' ||
          typeof second === 'symbol' ||
          typeof third === 'symbol' ||
          !second.data ||
          !first.data ||
          !third.data
        )
          throw new Error();
        expect(first.data.title).toBe(third.data.title);
        expect(first.data.author).toBeUndefined();
        // maintain cache when nested value is undefined
        expect(first.data).toBe(second.data);
        expect(first).toBe(second);
        // update value when nested value becomes defined
        expect(third.data.author).toBeDefined();
        expect(third.data.author.name).toEqual(expect.any(String));
        expect(first).not.toBe(third);
      });

      test('nested entity becomes present in entity table with numbers', () => {
        const memo = new MemoCache();

        class User extends IDEntity {
          name = '';
        }
        class Article extends IDEntity {
          title = '';
          author = User.fromJS();
          static schema = {
            author: User,
          };
        }
        const result = { data: 123 };
        const entities = {
          Article: {
            123: {
              author: 8472,
              id: 123,
              title: 'A Great Article',
            },
          },
          User: {
            8472: {
              id: 8472,
              name: 'Paul',
            },
          },
        };
        const emptyEntities = {
          ...entities,
          // no Users exist
          User: {},
        };
        const { data: first } = memo.denormalize(
          { data: Article },
          result,
          emptyEntities,
        );

        const { data: second } = memo.denormalize(
          { data: Article },
          result,
          emptyEntities,
        );

        const { data: third } = memo.denormalize(
          { data: Article },
          result,
          // now has users
          entities,
        );

        if (
          typeof first === 'symbol' ||
          typeof second === 'symbol' ||
          typeof third === 'symbol' ||
          !second.data ||
          !first.data ||
          !third.data
        )
          throw new Error();
        expect(first.data.title).toBe(third.data.title);
        expect(first.data.author).toBeUndefined();
        // maintain cache when nested value is undefined
        expect(first.data).toBe(second.data);
        expect(first).toBe(second);
        // update value when nested value becomes defined
        expect(third.data.author).toBeDefined();
        expect(third.data.author.name).toEqual(expect.any(String));
        expect(first).not.toBe(third);
      });
    });
    test('denormalizes plain object with no entities', () => {
      const memo = new MemoCache();

      const input = {
        firstThing: { five: 5, seven: 42 },
        secondThing: { cars: 'fifo' },
      };
      const schema = {
        firstThing: { five: 0, seven: 0 },
        secondThing: { cars: '' },
      };
      const { data: first } = memo.denormalize(schema, input, {});
      expect(first).toEqual(input);
      // should maintain referential equality
      const { data: second } = memo.denormalize(schema, input, {});
      expect(second).toBe(first);
    });

    test('passthrough for null schema and an object input', () => {
      const memo = new MemoCache();

      const input = {
        firstThing: { five: 5, seven: 42 },
        secondThing: { cars: 'never' },
      };
      const { data } = memo.denormalize(null, input, {});
      expect(data).toBe(input);
    });

    test('passthrough for null schema and an number input', () => {
      const memo = new MemoCache();

      const input = 5;
      const { data } = memo.denormalize(null, input, {});
      expect(data).toBe(input);
    });

    test('passthrough for undefined schema and an object input', () => {
      const memo = new MemoCache();

      const input = {
        firstThing: { five: 5, seven: 42 },
        secondThing: { cars: 'never' },
      };
      const { data } = memo.denormalize(undefined, input, {});
      expect(data).toBe(input);
    });

    describe('null inputs when expecting entities', () => {
      class User extends IDEntity {}
      class Comment extends IDEntity {
        comment = '';
        static schema = {
          user: User,
        };
      }
      class Article extends IDEntity {
        title = '';
        body = '';
        author = User.fromJS({});
        comments = [];
        static schema = {
          author: User,
          comments: [Comment],
        };
      }

      test('handles null at top level', () => {
        const memo = new MemoCache();

        const denorm = memo.denormalize({ data: Article }, null, {}).data;
        expect(denorm).toEqual(null);
      });

      test('handles undefined at top level', () => {
        const memo = new MemoCache();

        const denorm = memo.denormalize({ data: Article }, undefined, {}).data;
        expect(denorm).toEqual(undefined);
      });

      test('handles null in nested place', () => {
        const memo = new MemoCache();

        const input = {
          data: { id: '5', title: 'hehe', author: null, comments: [] },
        };
        const denorm = memo.denormalize({ data: Article }, input, {}).data;
        expect(denorm).toMatchInlineSnapshot(`
          {
            "data": Article {
              "author": null,
              "body": "",
              "comments": [],
              "id": "5",
              "title": "hehe",
            },
          }
        `);
      });
    });
  });
  describe('buildQueryKey', () => {
    it('should work with Object', () => {
      const schema = new schemas.Object({
        data: new schemas.Object({
          article: CoolerArticle,
        }),
      });
      expect(
        new MemoCache().buildQueryKey(schema, [{ id: 5 }], {
          entities: {
            [CoolerArticle.key]: { '5': {} },
          },
          indexes: {},
        }),
      ).toEqual({
        data: { article: 5 },
      });
    });

    it('should work with number argument', () => {
      const schema = new schemas.Object({
        data: new schemas.Object({
          article: CoolerArticle,
        }),
      });
      expect(
        new MemoCache().buildQueryKey(schema, [5], {
          entities: {
            [CoolerArticle.key]: { '5': {} },
          },
          indexes: {},
        }),
      ).toEqual({
        data: { article: '5' },
      });
    });

    it('should work with string argument', () => {
      const schema = new schemas.Object({
        data: new schemas.Object({
          article: CoolerArticle,
        }),
      });
      expect(
        new MemoCache().buildQueryKey(schema, ['5'], {
          entities: {
            [CoolerArticle.key]: { '5': {} },
          },
          indexes: {},
        }),
      ).toEqual({
        data: { article: '5' },
      });
    });

    it('should be undefined with Array', () => {
      const schema = {
        data: new schemas.Array(CoolerArticle),
      };
      expect(
        new MemoCache().buildQueryKey(schema, [{ id: 5 }], {
          entities: {
            [CoolerArticle.key]: { '5': {} },
          },
          indexes: {},
        }),
      ).toStrictEqual({
        data: undefined,
      });

      const schema2 = {
        data: [CoolerArticle],
      };
      expect(
        new MemoCache().buildQueryKey(schema2, [{ id: 5 }], {
          entities: {
            [CoolerArticle.key]: { '5': {} },
          },
          indexes: {},
        }),
      ).toStrictEqual({
        data: undefined,
      });
    });

    it('should be undefined with Values', () => {
      const schema = {
        data: new schemas.Values(CoolerArticle),
      };
      expect(
        new MemoCache().buildQueryKey(schema, [{ id: 5 }], {
          entities: {
            [CoolerArticle.key]: { '5': {} },
          },
          indexes: {},
        }),
      ).toStrictEqual({
        data: undefined,
      });
    });

    it('should be undefined with Union and type', () => {
      const schema = UnionResource.get.schema;
      expect(
        new MemoCache().buildQueryKey(schema, [{ id: 5 }], {
          entities: {
            [CoolerArticle.key]: {
              '5': {},
            },
          },
          indexes: {},
        }),
      ).toBe(undefined);
    });

    it('should work with Union', () => {
      const schema = UnionResource.get.schema;
      expect(
        new MemoCache().buildQueryKey(schema, [{ id: 5, type: 'first' }], {
          entities: {
            [FirstUnion.key]: {
              '5': {},
            },
          },
          indexes: {},
        }),
      ).toMatchInlineSnapshot(`
        {
          "id": 5,
          "schema": "first",
        }
      `);
    });

    it('should work with primitive defaults', () => {
      const schema = {
        pagination: { next: '', previous: '' },
        data: CoolerArticle,
      };
      expect(
        new MemoCache().buildQueryKey(schema, [{ id: 5 }], {
          entities: {
            [CoolerArticle.key]: {
              '5': {},
            },
          },
          indexes: {},
        }),
      ).toEqual({
        pagination: { next: '', previous: '' },
        data: 5,
      });
    });

    it('should work with indexes', () => {
      const schema = {
        pagination: { next: '', previous: '' },
        data: IndexedUser,
      };
      expect(
        new MemoCache().buildQueryKey(schema, [{ username: 'bob' }], {
          entities: {
            [IndexedUser.key]: {
              '5': {},
            },
          },
          indexes: {
            [IndexedUser.key]: {
              username: {
                bob: '5',
              },
            },
          },
        }),
      ).toEqual({
        pagination: { next: '', previous: '' },
        data: '5',
      });
      expect(
        new MemoCache().buildQueryKey(
          schema,
          [{ username: 'bob', mary: 'five' }],
          {
            entities: {
              [IndexedUser.key]: {
                '5': {},
              },
            },
            indexes: {
              [IndexedUser.key]: {
                username: {
                  bob: '5',
                },
              },
            },
          },
        ),
      ).toEqual({
        pagination: { next: '', previous: '' },
        data: '5',
      });
    });

    it('should work with indexes but none set', () => {
      const schema = {
        pagination: { next: '', previous: '' },
        data: IndexedUser,
      };
      expect(
        new MemoCache().buildQueryKey(schema, [{ username: 'bob' }], {
          entities: {
            [IndexedUser.key]: {
              '5': {},
            },
          },
          indexes: {
            [IndexedUser.key]: {
              username: {
                charles: '5',
              },
            },
          },
        }),
      ).toEqual({
        pagination: { next: '', previous: '' },
        data: undefined,
      });
      expect(
        new MemoCache().buildQueryKey(schema, [{ hover: 'bob' }], {
          entities: {
            [IndexedUser.key]: {
              '5': {},
            },
          },
          indexes: {
            [IndexedUser.key]: {
              username: {
                charles: '5',
              },
            },
          },
        }),
      ).toEqual({
        pagination: { next: '', previous: '' },
        data: undefined,
      });
    });

    it('should work with indexes but no indexes stored', () => {
      const schema = {
        pagination: { next: '', previous: '' },
        data: IndexedUser,
      };
      expect(
        new MemoCache().buildQueryKey(schema, [{ username: 'bob' }], {
          entities: { [IndexedUser.key]: { '5': {} } },
          indexes: {},
        }),
      ).toEqual({
        pagination: { next: '', previous: '' },
        data: undefined,
      });
      expect(
        new MemoCache().buildQueryKey(schema, [{ hover: 'bob' }], {
          entities: { [IndexedUser.key]: { '5': {} } },
          indexes: {},
        }),
      ).toEqual({
        pagination: { next: '', previous: '' },
        data: undefined,
      });
    });

    describe('legacy schema', () => {
      class MyEntity extends CoolerArticle {
        static queryKey(args: any[], unvisit: any, snapshot: IQueryDelegate) {
          if (!args[0]) return;
          let id: undefined | number | string;
          if (['string', 'number'].includes(typeof args[0])) {
            id = `${args[0]}`;
          } else {
            id = this.pk(args[0], undefined, '', args);
          }
          // Was able to infer the entity's primary key from params
          if (id !== undefined && id !== '' && snapshot.getEntity(this.key, id))
            return id;
        }
      }

      it('should work with string argument', () => {
        const schema = new schemas.Object({
          data: new schemas.Object({
            article: MyEntity,
          }),
        });
        expect(
          new MemoCache().buildQueryKey(schema, ['5'], {
            entities: {
              [MyEntity.key]: { '5': {} },
            },
            indexes: {},
          }),
        ).toEqual({
          data: { article: '5' },
        });
      });

      it('should be undefined even when Entity.queryKey gives id if entity is not present', () => {
        const schema = new schemas.Object({
          data: new schemas.Object({
            article: MyEntity,
          }),
        });
        const memo = new MemoCache();
        expect(
          memo.buildQueryKey(schema, ['5'], { entities: {}, indexes: {} }),
        ).toEqual({
          data: { article: undefined },
        });
        expect(
          memo.buildQueryKey(schema, ['5'], {
            entities: { [MyEntity.key]: { '5': { id: '5', title: 'hi' } } },
            indexes: {},
          }),
        ).toEqual({
          data: { article: '5' },
        });
      });

      describe('referential equality', () => {
        const schema = new schemas.Object({
          data: new schemas.Object({
            article: MyEntity,
          }),
        });
        const memo = new MemoCache();
        const state = {
          entities: { [MyEntity.key]: {} },
          indexes: {},
        };
        const first = memo.buildQueryKey(schema, ['5'], state);
        it('should maintain referential equality', () => {
          expect(memo.buildQueryKey(schema, ['5'], state)).toBe(first);
        });
        it('should not change on index update if not used', () => {
          expect(
            memo.buildQueryKey(schema, ['5'], {
              ...state,
              indexes: {
                [MyEntity.key]: {},
              },
            }),
          ).toBe(first);
        });
        it('should be new when entity is updated', () => {
          const withEntity = memo.buildQueryKey(schema, ['5'], {
            entities: {
              [MyEntity.key]: { '5': { id: '5', title: 'hi' } },
            },
            indexes: state.indexes,
          });
          expect(withEntity).not.toBe(first);
          expect(withEntity.data).toEqual({ article: '5' });
        });
        it('should be the same if other entities are updated', () => {
          const withEntity = memo.buildQueryKey(schema, ['5'], {
            entities: {
              ...state.entities,
              ['another']: { '5': { id: '5', title: 'hi' } },
            },
            indexes: state.indexes,
          });
          expect(withEntity).toBe(first);
        });
        it('should be the same if other entities of the same type are updated', () => {
          const withEntity = memo.buildQueryKey(schema, ['5'], {
            entities: {
              ...state.entities,
              [MyEntity.key]: {
                ...state.entities[MyEntity.key],
                '500': { id: '500', title: 'second title' },
              },
            },
            indexes: state.indexes,
          });
          expect(withEntity).toBe(first);
        });
      });
    });
  });

  describe.each([
    ['direct', <T>(data: T) => data, BaseDelegate],
    ['immutable', fromJSState, DelegateImmutable],
  ])(`query (%s)`, (_, createInput, Delegate) => {
    class Cat extends IDEntity {
      id = '0';
      name = '';
      username = '';
      static indexes = ['username' as const];
    }
    const state = createInput({
      entities: {
        Cat: {
          1: { id: '1', name: 'Milo', username: 'm' },
          2: { id: '2', name: 'Jake', username: 'j' },
          3: { id: '3', name: 'Zeta', username: 'z' },
        },
      },
      indexes: {
        Cat: {
          username: { m: '1', j: '2', z: '3' },
        },
      },
    });

    test('works with indexes', () => {
      const m = new MemoCache(Delegate).query(
        Cat,
        [{ username: 'm' }],
        state,
      ).data;
      expect(m).toBeDefined();
      expect(m).toMatchSnapshot();
      expect(
        new MemoCache(Delegate).query(
          Cat,
          [{ username: 'doesnotexist' }],
          state,
        ).data,
      ).toBeUndefined();
    });

    test('works with pk', () => {
      const m = new MemoCache(Delegate).query(Cat, [{ id: '1' }], state);
      expect(m).toBeDefined();
      expect(m).toMatchSnapshot();
      expect(
        new MemoCache(Delegate).query(Cat, [{ id: 'doesnotexist' }], state)
          .data,
      ).toBeUndefined();
    });
  });
});
