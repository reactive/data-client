import { DataProvider } from '@data-client/react';
import { schema } from '@data-client/rest';
import {
  ArticleFromMixin,
  CoolerArticle,
  CoolerArticleResource,
  FirstUnion,
  SecondUnion,
  UnionResource,
  UnionSchema,
  User,
} from '__tests__/new';
import nock from 'nock';

import { useQuery } from '../..';
import { makeRenderDataClient, act } from '../../../../../test';

export const payload = {
  id: 5,
  title: 'hi ho',
  content: 'whatever',
  tags: ['a', 'best', 'react'],
};

export const createPayload = {
  id: 1,
  title: 'hi ho',
  content: 'whatever',
  tags: ['a', 'best', 'react'],
};
let renderDataClient: ReturnType<typeof makeRenderDataClient>;
let mynock: nock.Scope;

beforeEach(() => {
  renderDataClient = makeRenderDataClient(DataProvider);
  mynock = nock(/.*/).defaultReplyHeaders({
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  });
});
afterEach(() => {
  nock.cleanAll();
});

describe('set', () => {
  let errorspy: jest.MockInstance<typeof global.console.error, any>;
  beforeEach(() => {
    errorspy = jest
      .spyOn(global.console, 'error')
      .mockImplementation(() => {}) as any;
  });
  afterEach(() => {
    errorspy.mockRestore();
  });

  it('should update store when set is complete', async () => {
    const { result, controller } = renderDataClient(() => {
      return useQuery(CoolerArticle, { id: payload.id });
    });
    expect(result.current).toBeUndefined();
    let promise: any;
    act(() => {
      promise = controller.set(CoolerArticle, { id: 5 }, payload);
    });
    await act(() => promise);
    expect(result.current).toBeDefined();
    expect(result.current?.content).toEqual(payload.content);
    expect(result.current).toEqual(CoolerArticle.fromJS(payload));

    // type tests
    // TODO: move these to own unit tests if/when applicable
    () => {
      controller.set(CoolerArticle, { id: 5 }, article => ({
        id: 5,
        title: `${article.title}!`,
      }));
      // @ts-expect-error
      controller.set(CoolerArticle, payload);
      controller.set(
        CoolerArticle,
        // @ts-expect-error
        payload.id,
        payload,
      );
    };
  });

  it('should batch set entities with an array schema', async () => {
    const { controller } = renderDataClient(() => null);
    let promise: any;
    act(() => {
      controller.set(CoolerArticle, { id: 5 }, { ...payload, content: 'kept' });
      controller.set(CoolerArticle, { id: 1 }, createPayload);
      promise = controller.set(
        [CoolerArticle],
        [
          { id: 5, title: 'merged' },
          { id: 6, title: 'new' },
        ],
      );
    });
    await act(() => promise);
    const state = controller.getState();
    expect(controller.get(CoolerArticle, { id: 5 }, state)).toMatchObject({
      title: 'merged',
      content: 'kept',
    });
    expect(controller.get(CoolerArticle, { id: 6 }, state)?.title).toBe('new');
    expect(controller.get(CoolerArticle, { id: 1 }, state)?.title).toBe(
      createPayload.title,
    );

    act(() => {
      promise = controller.set(new schema.Array(CoolerArticle), [
        { id: 6, title: 'array class' },
      ]);
    });
    await act(() => promise);
    expect(
      controller.get(CoolerArticle, { id: 6 }, controller.getState())?.title,
    ).toBe('array class');

    // type tests
    () => {
      // @ts-expect-error array schemas have no args
      controller.set([CoolerArticle], { id: 5 }, [payload]);
      // @ts-expect-error array schemas have no previous value to update
      controller.set([CoolerArticle], (articles: any) => articles);
      // @ts-expect-error value must be an array
      controller.set([CoolerArticle], payload);
      // @ts-expect-error entities need args, even with an array value
      controller.set(CoolerArticle, [payload]);

      // rows are typed by the Entity
      controller.set([CoolerArticle], [{ id: '5', title: 'coerced' }]);
      controller.set([CoolerArticle], [{ author: { id: 1, username: 'x' } }]);
      // @ts-expect-error rows must be objects
      controller.set([CoolerArticle], [1, 'str']);
      // @ts-expect-error title is a string
      controller.set([CoolerArticle], [{ id: 5, title: false }]);
      // @ts-expect-error unknown field
      controller.set([CoolerArticle], [{ id: 5, bogus: 1 }]);
      const articles = new schema.Array(CoolerArticle);
      // @ts-expect-error title is a string
      controller.set(articles, [{ id: 5, title: false }]);

      // @ts-expect-error only one Entity per array; use a Union for several
      controller.set([CoolerArticle, User], [{ id: 5 }]);
      const mixed = [CoolerArticle, User];
      // @ts-expect-error only one Entity per array
      controller.set(mixed, [{ id: 5 }]);
      // @ts-expect-error nested arrays are not rows of entities
      controller.set([[CoolerArticle]], [[{ id: 5 }]]);
      // @ts-expect-error functions are not schemas of entities
      controller.set([() => 1], [{ id: 5 }]);
      // @ts-expect-error plain objects are not entities
      controller.set([{ bogus: 1 }], [{ bogus: 5 }]);
      // @ts-expect-error schema.Object is not a list
      controller.set(new schema.Object({ a: CoolerArticle }), [{ id: 5 }]);
      // @ts-expect-error schema.Object is not keyed rows either
      controller.set(new schema.Object({ a: CoolerArticle }), { a: { id: 5 } });
      // @ts-expect-error Lazy is not a list
      controller.set(new schema.Lazy([CoolerArticle]), [{ id: 5 }]);
      // @ts-expect-error Lazy is not keyed rows
      controller.set(new schema.Lazy(CoolerArticle), { a: { id: 5 } });
      const query = new schema.Query(new schema.All(CoolerArticle), x => x);
      // @ts-expect-error Query is derived from the store, so not writable
      controller.set([query], [{ id: 5 }]);
      // @ts-expect-error Collections are keyed by args
      controller.set([new schema.Collection([CoolerArticle])], [{ id: 5 }]);
      // @ts-expect-error Values take a keyed object, not an array
      controller.set(new schema.Values(CoolerArticle), [{ id: 5 }]);
      // @ts-expect-error Arrays take an array, not a keyed object
      controller.set([CoolerArticle], { 5: { id: 5 } });

      // non-literal array schemas, like an Endpoint's
      const list: (typeof CoolerArticle)[] = [CoolerArticle];
      controller.set(list, [{ id: 5 }]);
      controller.set(UnionResource.getList.schema, [
        { id: '1', type: 'first', firstOnlyField: 1 },
      ]);
    };
  });

  it('should batch set polymorphic, Values and Invalidate schemas', async () => {
    const { controller } = renderDataClient(() => null);
    let promise: any;
    act(() => {
      promise = controller.set(
        [UnionSchema],
        [
          { id: '1', body: 'one', type: 'first' },
          { id: '2', body: 'two', type: 'second' },
        ],
      );
    });
    await act(() => promise);
    act(() => {
      promise = controller.set(
        new schema.Array({ first: FirstUnion, second: SecondUnion }, 'type'),
        [{ id: '3', body: 'three', type: 'first' }],
      );
    });
    await act(() => promise);
    act(() => {
      promise = controller.set(new schema.Values(CoolerArticle), {
        a: { id: 7, title: 'seven' },
        b: { id: 8, title: 'eight' },
      });
    });
    await act(() => promise);
    const state = controller.getState();
    expect(controller.get(FirstUnion, { id: '1' }, state)?.body).toBe('one');
    expect(controller.get(SecondUnion, { id: '2' }, state)?.body).toBe('two');
    expect(controller.get(FirstUnion, { id: '3' }, state)?.body).toBe('three');
    expect(controller.get(CoolerArticle, { id: 7 }, state)?.title).toBe(
      'seven',
    );
    expect(controller.get(CoolerArticle, { id: 8 }, state)?.title).toBe(
      'eight',
    );

    act(() => {
      promise = controller.set(
        [new schema.Invalidate(CoolerArticle)],
        [{ id: 7 }, { id: 8 }],
      );
    });
    await act(() => promise);
    const after = controller.getState();
    expect(controller.get(CoolerArticle, { id: 7 }, after)).toBeUndefined();
    expect(controller.get(CoolerArticle, { id: 8 }, after)).toBeUndefined();

    // type tests
    () => {
      // @ts-expect-error body is a string
      controller.set([UnionSchema], [{ id: '1', body: false }]);
      // each row is checked against the member its discriminator selects
      // @ts-expect-error secondeOnlyField is not a field of FirstUnion
      controller.set([UnionSchema], [{ type: 'first', secondeOnlyField: 1 }]);
      // @ts-expect-error firstOnlyField is a number
      controller.set([UnionSchema], [{ firstOnlyField: false }]);
      // @ts-expect-error unknown field
      controller.set([UnionSchema], [{ id: '1', bogus: 1 }]);
      // discriminators read by a schemaAttribute function must be fields too
      const byKind = new schema.Union(
        { first: FirstUnion, second: SecondUnion },
        (input: any) => input.type,
      );
      controller.set([byKind], [{ id: '1', type: 'first' }]);
      // @ts-expect-error kind is not a field
      controller.set([byKind], [{ id: '1', kind: 'first' }]);
      controller.set(
        new schema.Array(
          { first: FirstUnion, second: SecondUnion },
          (input: any) => input.type,
        ),
        [{ id: '1', type: 'first' }],
      );
      controller.set(new schema.Array(new schema.Invalidate(UnionSchema)), [
        { id: '1', type: 'first' },
      ]);
      // @ts-expect-error id is a number
      controller.set([new schema.Invalidate(CoolerArticle)], [{ id: false }]);
      controller.set(byKind, { id: '1' }, { id: '1', type: 'first' });
      // @ts-expect-error body is a string
      controller.set(byKind, { id: '1' }, { id: '1', body: false });
      controller.set(UnionSchema, { id: '1', type: 'first' }, prev => ({
        ...prev,
        body: 'updated',
      }));
      controller.set(
        UnionSchema,
        { id: '1', type: 'first' },
        // @ts-expect-error firstOnlyField is a number
        prev => ({ ...prev, firstOnlyField: false }),
      );
      controller.set(
        UnionSchema,
        { id: '1', type: 'first' },
        // @ts-expect-error secondeOnlyField is not a field of FirstUnion
        { type: 'first', secondeOnlyField: 1 },
      );
      // EntityMixin rows
      controller.set([ArticleFromMixin], [{ id: 5, title: 'mixin' }]);
      // @ts-expect-error title is a string
      controller.set(new schema.Values(CoolerArticle), { a: { title: false } });
    };
  });

  it('should invalidate one entity with an Invalidate schema', async () => {
    const { controller } = renderDataClient(() => null);
    const invalidate = new schema.Invalidate(CoolerArticle);
    let promise: any;
    act(() => {
      controller.set(CoolerArticle, { id: 5 }, payload);
      controller.set(CoolerArticle, { id: 1 }, createPayload);
    });
    act(() => {
      promise = controller.set(invalidate, { id: 5 });
    });
    await act(() => promise);
    expect(
      controller.get(CoolerArticle, { id: 5 }, controller.getState()),
    ).toBeUndefined();
    expect(
      controller.get(CoolerArticle, { id: 1 }, controller.getState())?.title,
    ).toBe(createPayload.title);

    // type tests
    () => {
      controller.set(new schema.Invalidate(UnionSchema), {
        id: '1',
        type: 'first',
      });
      // @ts-expect-error title is a string
      controller.set(invalidate, { id: 5, title: false });
      // @ts-expect-error unknown field
      controller.set(invalidate, { id: 5, bogus: 1 });
      // @ts-expect-error Invalidate takes no args
      controller.set(invalidate, { id: 5 }, { id: 5 });
      // @ts-expect-error one row, not a list; use set([invalidate], rows) for many
      controller.set(invalidate, [{ id: 5 }]);
      // @ts-expect-error invalid entities have no previous value to update
      controller.set(invalidate, (article: any) => article);
      // @ts-expect-error value is required
      controller.set(invalidate);
      // @ts-expect-error Lazy only stores references
      controller.set(new schema.Lazy(CoolerArticle), { id: 5 });
    };
  });

  it('should type values by the schema', async () => {
    const { controller } = renderDataClient(() => null);
    const list = CoolerArticleResource.getList.schema;
    const all = new schema.All(CoolerArticle);
    const titles = new schema.Query(all, articles =>
      articles.map(article => article.title),
    );
    const titleCount = new schema.Query(titles, list => list.length);
    let promise: any;
    act(() => {
      promise = controller.set(list, [{ id: 5, title: 'listed' }]);
    });
    await act(() => promise);
    act(() => {
      promise = controller.set(titles, [{ id: 6, title: 'queried' }]);
    });
    await act(() => promise);
    act(() => {
      promise = controller.set(titleCount, [{ id: 8, title: 'nested' }]);
    });
    await act(() => promise);
    const state = controller.getState();
    expect(controller.get(list, state)?.map(({ id }) => id)).toEqual([5]);
    expect(controller.get(titles, state)?.sort()).toEqual([
      'listed',
      'nested',
      'queried',
    ]);
    expect(controller.get(titleCount, state)).toBe(3);

    // type tests
    () => {
      controller.set(all, [{ id: '5', title: 'coerced' }]);
      controller.set(list, articles => [
        ...articles.map(({ id }) => ({ id })),
        { id: 7 },
      ]);
      // @ts-expect-error All takes a list of rows
      controller.set(all, 42);
      // @ts-expect-error title is a string
      controller.set(all, [{ id: 5, title: false }]);
      // @ts-expect-error Collections take a list of rows
      controller.set(list, 'anything');
      // @ts-expect-error unknown field
      controller.set(list, [{ id: 5, bogus: 1 }]);
      // @ts-expect-error updaters must return rows
      controller.set(list, () => 42);
      // @ts-expect-error Queries take their schema's input, not process() output
      controller.set(titles, ['listed']);
      // @ts-expect-error nested Queries take the innermost schema's input
      controller.set(titleCount, 3);
      // @ts-expect-error title is a string
      controller.set(CoolerArticle, { id: 5 }, { id: 5, title: false });
      // @ts-expect-error updaters must return the Entity's fields
      controller.set(CoolerArticle, { id: 5 }, () => ({ title: false }));
    };
  });

  it('should update store with error', async () => {
    const { result, controller } = renderDataClient(() => {
      return useQuery(CoolerArticle, { id: payload.id });
    });
    expect(result.current).toBeUndefined();
    let promise: any;
    act(() => {
      // @ts-expect-error testing runtime error
      promise = controller.set(CoolerArticle, { id: 5 }, 5);
    });
    expect(result.current).toBeUndefined();
    expect(errorspy.mock.calls.length).toBe(1);
    expect(errorspy.mock.calls).toMatchSnapshot();
  });
});
