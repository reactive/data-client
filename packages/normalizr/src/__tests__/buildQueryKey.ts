import { schema as schemas } from '@data-client/endpoint';
import {
  UnionResource,
  CoolerArticle,
  IndexedUser,
  FirstUnion,
} from '__tests__/new';

import buildQueryKey from '../buildQueryKey';
import {
  createLookupEntity,
  createLookupIndex,
} from '../denormalize/MemoCache';
import { LookupIndex, LookupEntities, NormalizedIndex } from '../interface';

describe('buildQueryKey()', () => {
  it('should work with Object', () => {
    const schema = new schemas.Object({
      data: new schemas.Object({
        article: CoolerArticle,
      }),
    });
    expect(
      buildQueryKey(
        schema,
        [{ id: 5 }],
        createLookupIndex({}),
        createLookupEntity({
          [CoolerArticle.key]: { '5': {} },
        }),
      ),
    ).toEqual({
      data: { article: '5' },
    });
  });

  it('should work with number argument', () => {
    const schema = new schemas.Object({
      data: new schemas.Object({
        article: CoolerArticle,
      }),
    });
    expect(
      buildQueryKey(
        schema,
        [5],
        createLookupIndex({}),
        createLookupEntity({
          [CoolerArticle.key]: { '5': {} },
        }),
      ),
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
      buildQueryKey(
        schema,
        ['5'],
        createLookupIndex({}),
        createLookupEntity({
          [CoolerArticle.key]: { '5': {} },
        }),
      ),
    ).toEqual({
      data: { article: '5' },
    });
  });

  it('should be undefined with Array', () => {
    const schema = {
      data: new schemas.Array(CoolerArticle),
    };
    expect(
      buildQueryKey(
        schema,
        [{ id: 5 }],
        createLookupIndex({}),
        createLookupEntity({
          [CoolerArticle.key]: { '5': {} },
        }),
      ),
    ).toStrictEqual({
      data: undefined,
    });

    const schema2 = {
      data: [CoolerArticle],
    };
    expect(
      buildQueryKey(
        schema2,
        [{ id: 5 }],
        createLookupIndex({}),
        createLookupEntity({
          [CoolerArticle.key]: { '5': {} },
        }),
      ),
    ).toStrictEqual({
      data: undefined,
    });
  });

  it('should be undefined with Values', () => {
    const schema = {
      data: new schemas.Values(CoolerArticle),
    };
    expect(
      buildQueryKey(
        schema,
        [{ id: 5 }],
        createLookupIndex({}),
        createLookupEntity({
          [CoolerArticle.key]: { '5': {} },
        }),
      ),
    ).toStrictEqual({
      data: undefined,
    });
  });

  it('should be undefined with Union and type', () => {
    const schema = UnionResource.get.schema;
    expect(
      buildQueryKey(
        schema,
        [{ id: 5 }],
        createLookupIndex({}),
        createLookupEntity({
          [CoolerArticle.key]: {
            '5': {},
          },
        }),
      ),
    ).toBe(undefined);
  });

  it('should work with Union', () => {
    const schema = UnionResource.get.schema;
    expect(
      buildQueryKey(
        schema,
        [{ id: 5, type: 'first' }],
        createLookupIndex({}),
        createLookupEntity({
          [FirstUnion.key]: {
            '5': {},
          },
        }),
      ),
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
      buildQueryKey(
        schema,
        [{ id: 5 }],
        createLookupIndex({}),
        createLookupEntity({
          [CoolerArticle.key]: {
            '5': {},
          },
        }),
      ),
    ).toEqual({
      pagination: { next: '', previous: '' },
      data: '5',
    });
  });

  it('should work with indexes', () => {
    const schema = {
      pagination: { next: '', previous: '' },
      data: IndexedUser,
    };
    expect(
      buildQueryKey(
        schema,
        [{ username: 'bob' }],
        createLookupIndex({
          [IndexedUser.key]: {
            username: {
              bob: '5',
            },
          },
        }),
        createLookupEntity({
          [IndexedUser.key]: {
            '5': {},
          },
        }),
      ),
    ).toEqual({
      pagination: { next: '', previous: '' },
      data: '5',
    });
    expect(
      buildQueryKey(
        schema,
        [{ username: 'bob', mary: 'five' }],
        createLookupIndex({
          [IndexedUser.key]: {
            username: {
              bob: '5',
            },
          },
        }),
        createLookupEntity({
          [IndexedUser.key]: {
            '5': {},
          },
        }),
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
      buildQueryKey(
        schema,
        [{ username: 'bob' }],
        createLookupIndex({
          [IndexedUser.key]: {
            username: {
              charles: '5',
            },
          },
        }),
        createLookupEntity({
          [IndexedUser.key]: {
            '5': {},
          },
        }),
      ),
    ).toEqual({
      pagination: { next: '', previous: '' },
      data: undefined,
    });
    expect(
      buildQueryKey(
        schema,
        [{ hover: 'bob' }],
        createLookupIndex({
          [IndexedUser.key]: {
            username: {
              charles: '5',
            },
          },
        }),
        createLookupEntity({
          [IndexedUser.key]: {
            '5': {},
          },
        }),
      ),
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
      buildQueryKey(
        schema,
        [{ username: 'bob' }],
        createLookupIndex({}),
        createLookupEntity({
          [IndexedUser.key]: { '5': {} },
        }),
      ),
    ).toEqual({
      pagination: { next: '', previous: '' },
      data: undefined,
    });
    expect(
      buildQueryKey(
        schema,
        [{ hover: 'bob' }],
        createLookupIndex({}),
        createLookupEntity({
          [IndexedUser.key]: { '5': {} },
        }),
      ),
    ).toEqual({
      pagination: { next: '', previous: '' },
      data: undefined,
    });
  });

  describe('legacy schema', () => {
    class MyEntity extends CoolerArticle {
      static queryKey(
        args: any[],
        queryKey: any,
        lookupIndex: LookupIndex,
        lookupEntities: LookupEntities,
      ) {
        if (!args[0]) return;
        let id: undefined | number | string;
        if (['string', 'number'].includes(typeof args[0])) {
          id = `${args[0]}`;
        } else {
          id = this.pk(args[0], undefined, '', args);
        }
        // Was able to infer the entity's primary key from params
        if (id !== undefined && id !== '' && lookupEntities(this.key)?.[id])
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
        buildQueryKey(
          schema,
          ['5'],
          createLookupIndex({}),
          createLookupEntity({
            [MyEntity.key]: { '5': {} },
          }),
        ),
      ).toEqual({
        data: { article: '5' },
      });
    });

    it('should be undefined even when Entity.infer gives id if entity is not present', () => {
      const schema = new schemas.Object({
        data: new schemas.Object({
          article: MyEntity,
        }),
      });
      expect(
        buildQueryKey(
          schema,
          ['5'],
          createLookupIndex({}),
          createLookupEntity({}),
        ),
      ).toEqual({
        data: { article: undefined },
      });
    });
  });
});
