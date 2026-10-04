import { DataProvider } from '@data-client/react';
import { schema } from '@data-client/rest';
import {
  ArticleFromMixin,
  CoolerArticle,
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
      controller.set(new schema.Lazy(() => [CoolerArticle]), [{ id: 5 }]);
      // @ts-expect-error Lazy is not keyed rows
      controller.set(new schema.Lazy(() => CoolerArticle), { a: { id: 5 } });
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

  it('should batch set polymorphic and Values schemas', async () => {
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

    // type tests
    () => {
      // @ts-expect-error body is a string
      controller.set([UnionSchema], [{ id: '1', body: false }]);
      // discriminators read by a schemaAttribute function need not be fields
      const byKind = new schema.Union(
        { first: FirstUnion, second: SecondUnion },
        (input: any) => input.kind,
      );
      controller.set([byKind], [{ id: '1', kind: 'first' }]);
      controller.set(
        new schema.Array(
          { first: FirstUnion, second: SecondUnion },
          (input: any) => input.kind,
        ),
        [{ id: '1', kind: 'first' }],
      );
      // EntityMixin rows
      controller.set([ArticleFromMixin], [{ id: 5, title: 'mixin' }]);
      // @ts-expect-error title is a string
      controller.set(new schema.Values(CoolerArticle), { a: { title: false } });
    };
  });

  it('should update store with error', async () => {
    const { result, controller } = renderDataClient(() => {
      return useQuery(CoolerArticle, { id: payload.id });
    });
    expect(result.current).toBeUndefined();
    let promise: any;
    act(() => {
      promise = controller.set(CoolerArticle, { id: 5 }, 5);
    });
    expect(result.current).toBeUndefined();
    expect(errorspy.mock.calls.length).toBe(1);
    expect(errorspy.mock.calls).toMatchSnapshot();
  });
});
