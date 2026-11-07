import { resource, Entity } from '@data-client/rest';

import { useSuspense, useCache, CacheProvider } from '../';
import { Fixture, FixtureEndpoint, makeRenderDataClient } from '../../../test';

class Nested extends Entity {
  id = '';
  name = '';
  pk() {
    return this.id;
  }
}

export class Some extends Entity {
  id = '';
  things: Nested[] = [];

  pk() {
    return this.id;
  }

  static schema = {
    things: [Nested],
  };
}
const SomeResource = resource({ path: '/some/:id', schema: Some });

class Discussion extends Entity {
  id = '';
  title = '';
  author?: Nested = undefined;
  static schema = { author: Nested };

  // the API sends `author: {}` when the author was deleted
  static process(
    input: any,
    parent: any,
    key: string | undefined,
    args: any[],
  ) {
    const processed = super.process(input, parent, key, args);
    if (processed.author && !Object.keys(processed.author).length)
      processed.author = undefined;
    return processed;
  }
}
const DiscussionResource = resource({
  path: '/discussions/:id',
  schema: Discussion,
});

const fixture: FixtureEndpoint = {
  endpoint: SomeResource.getList,
  args: [],
  response: [
    {
      id: '1',
      name: 'fails',
    },
    {
      id: '2',
      name: 'works',
      things: [
        {
          id: '1',
          name: 'first',
        },
        {
          id: '2',
          name: 'second',
        },
      ],
    },
    {
      id: '3',
      name: 'works',
      things: [
        {
          id: '2',
          name: 'second',
        },
      ],
    },
  ],
};

describe(`optional members`, () => {
  let renderDataClient: ReturnType<typeof makeRenderDataClient>;
  let errorSpy: jest.SpyInstance;
  beforeAll(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterAll(() => {
    errorSpy.mockRestore();
  });

  beforeEach(() => {
    renderDataClient = makeRenderDataClient(CacheProvider);
  });

  it('should return all members of list without suspending', () => {
    const { result } = renderDataClient(
      () => {
        return useSuspense(SomeResource.getList);
      },
      { initialFixtures: [fixture] },
    );
    expect(result.current).toMatchSnapshot();
  });

  it('should infer a detail based on list results', () => {
    const { result } = renderDataClient(
      () => {
        return useCache(SomeResource.get, { id: '1' });
      },
      { initialFixtures: [fixture] },
    );
    expect(result.current).toMatchSnapshot();
  });

  it('should not infer a missing entity', () => {
    const { result } = renderDataClient(
      () => {
        return useCache(SomeResource.get, { id: '4' });
      },
      { initialFixtures: [fixture] },
    );
    expect(result.current).toBeUndefined();
  });

  it('should not infer a missing entity (complex)', () => {
    const endpoint = SomeResource.get.extend({
      schema: {
        a: Some,
        b: Nested,
      },
    });
    const { result } = renderDataClient(
      () => {
        return useCache(endpoint, { id: '3' });
      },
      { initialFixtures: [fixture] },
    );
    expect(result.current.b).toBeUndefined();
    expect(result.current.a).toBeUndefined();
  });

  it('should suspend on partial results already there', () => {
    const endpoint = SomeResource.get.extend({
      schema: {
        a: Some,
        b: Nested,
      },
    });
    const { result } = renderDataClient(
      () => {
        return useSuspense(endpoint, { id: '3' });
      },
      { initialFixtures: [fixture] },
    );
    // undefined means suspend
    expect(result.current).toBeUndefined();
  });

  it('should infer even with nested missing', () => {
    const endpoint = SomeResource.get.extend({
      schema: {
        a: Some,
        b: Nested,
      },
    });
    const { result } = renderDataClient(
      () => {
        return useCache(endpoint, { id: '2' });
      },
      { initialFixtures: [fixture] },
    );
    expect(result.current).toMatchSnapshot();
  });

  // Eval for migration problem P5 (bulletproof-react, #4607): the documented
  // process() recipe (docs/rest/api/Entity.md#optional-members)
  it('should render an empty nested entity ({}) as undefined', () => {
    const { result } = renderDataClient(
      () => {
        return useSuspense(DiscussionResource.get, { id: '1' });
      },
      {
        initialFixtures: [
          {
            endpoint: DiscussionResource.get,
            args: [{ id: '1' }],
            response: { id: '1', title: 'hi', author: {} },
          },
        ],
      },
    );
    expect(result.current).toBeInstanceOf(Discussion);
    expect(result.current.title).toBe('hi');
    expect(result.current.author).toBeUndefined();
  });
});
