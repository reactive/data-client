import { createResource, Entity } from '@data-client/rest';

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
const SomeResource = createResource({ path: '/some/:id', schema: Some });

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
});
