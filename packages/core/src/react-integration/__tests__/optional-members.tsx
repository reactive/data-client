import { Entity, Resource } from '@rest-hooks/rest';

import { useResource, useCache } from '..';
import {
  Fixture,
  makeCacheProvider,
  makeRenderRestHook,
} from '../../../../test';

class Nested extends Entity {
  id = '';
  name = '';
  pk() {
    return this.id;
  }
}

export class SomeResource extends Resource {
  id = '';
  things: Nested[] = [];

  pk() {
    return this.id;
  }

  static schema = {
    things: [Nested],
  };

  static urlRoot = '/some';
}

const fixture: Fixture = {
  request: SomeResource.list(),
  params: {},
  result: [
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
  let renderRestHook: ReturnType<typeof makeRenderRestHook>;

  beforeEach(() => {
    renderRestHook = makeRenderRestHook(makeCacheProvider);
  });

  it('should return all members of list without suspending', () => {
    const { result } = renderRestHook(
      () => {
        return useResource(SomeResource.list(), {});
      },
      { results: [fixture] },
    );
    expect(result.current).toMatchSnapshot();
  });

  it('should infer a detail based on list results', () => {
    const { result } = renderRestHook(
      () => {
        return useCache(SomeResource.detail(), { id: '1' });
      },
      { results: [fixture] },
    );
    expect(result.current).toMatchSnapshot();
  });

  it('should not infer a missing entity', () => {
    const { result } = renderRestHook(
      () => {
        return useCache(SomeResource.detail(), { id: '4' });
      },
      { results: [fixture] },
    );
    expect(result.current).toBeUndefined();
  });

  it('should not infer a missing entity (complex)', () => {
    const endpoint = SomeResource.detail().extend({
      schema: {
        a: SomeResource,
        b: Nested,
      },
    });
    const { result } = renderRestHook(
      () => {
        return useCache(endpoint, { id: '3' });
      },
      { results: [fixture] },
    );
    expect(result.current.b).toBeUndefined();
    expect(result.current.a).toBeUndefined();
  });

  it('should suspend on partial results already there', () => {
    const endpoint = SomeResource.detail().extend({
      schema: {
        a: SomeResource,
        b: Nested,
      },
    });
    const { result } = renderRestHook(
      () => {
        return useResource(endpoint, { id: '3' });
      },
      { results: [fixture] },
    );
    // undefined means suspend
    expect(result.current).toBeUndefined();
  });

  it('should infer even with nested missing', () => {
    const endpoint = SomeResource.detail().extend({
      schema: {
        a: SomeResource,
        b: Nested,
      },
    });
    const { result } = renderRestHook(
      () => {
        return useCache(endpoint, { id: '2' });
      },
      { results: [fixture] },
    );
    expect(result.current).toMatchSnapshot();
  });
});
