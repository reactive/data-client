import { schema as schemas } from '@data-client/endpoint';
import {
  UnionResource,
  CoolerArticle,
  IndexedUser,
  FirstUnion,
} from '__tests__/new';

import buildInferredResults from '../inferResults';
import { NormalizedIndex } from '../interface';

describe('inferResults()', () => {
  it('should work with Object', () => {
    const schema = new schemas.Object({
      data: new schemas.Object({
        article: CoolerArticle,
      }),
    });
    expect(
      buildInferredResults(
        schema,
        [{ id: 5 }],
        {},
        { [CoolerArticle.key]: { '5': {} } },
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
      buildInferredResults(
        schema,
        [5],
        {},
        { [CoolerArticle.key]: { '5': {} } },
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
      buildInferredResults(
        schema,
        ['5'],
        {},
        { [CoolerArticle.key]: { '5': {} } },
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
      buildInferredResults(
        schema,
        [{ id: 5 }],
        {},
        { [CoolerArticle.key]: { '5': {} } },
      ),
    ).toStrictEqual({
      data: undefined,
    });

    const schema2 = {
      data: [CoolerArticle],
    };
    expect(
      buildInferredResults(
        schema2,
        [{ id: 5 }],
        {},
        { [CoolerArticle.key]: { '5': {} } },
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
      buildInferredResults(
        schema,
        [{ id: 5 }],
        {},
        { [CoolerArticle.key]: { '5': {} } },
      ),
    ).toStrictEqual({
      data: undefined,
    });
  });

  it('should be undefined with Union and type', () => {
    const schema = UnionResource.get.schema;
    expect(
      buildInferredResults(
        schema,
        [{ id: 5 }],
        {},
        {
          [CoolerArticle.key]: {
            '5': {},
          },
        },
      ),
    ).toBe(undefined);
  });

  it('should work with Union', () => {
    const schema = UnionResource.get.schema;
    expect(
      buildInferredResults(
        schema,
        [{ id: 5, type: 'first' }],
        {},
        {
          [FirstUnion.key]: {
            '5': {},
          },
        },
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
      buildInferredResults(
        schema,
        [{ id: 5 }],
        {},
        {
          [CoolerArticle.key]: {
            '5': {},
          },
        },
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
      buildInferredResults(
        schema,
        [{ username: 'bob' }],
        {
          [IndexedUser.key]: {
            username: {
              bob: '5',
            },
          },
        },
        {
          [IndexedUser.key]: {
            '5': {},
          },
        },
      ),
    ).toEqual({
      pagination: { next: '', previous: '' },
      data: '5',
    });
    expect(
      buildInferredResults(
        schema,
        [{ username: 'bob', mary: 'five' }],
        {
          [IndexedUser.key]: {
            username: {
              bob: '5',
            },
          },
        },
        {
          [IndexedUser.key]: {
            '5': {},
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
      buildInferredResults(
        schema,
        [{ username: 'bob' }],
        {
          [IndexedUser.key]: {
            username: {
              charles: '5',
            },
          },
        },
        {
          [IndexedUser.key]: {
            '5': {},
          },
        },
      ),
    ).toEqual({
      pagination: { next: '', previous: '' },
      data: undefined,
    });
    expect(
      buildInferredResults(
        schema,
        [{ hover: 'bob' }],
        {
          [IndexedUser.key]: {
            username: {
              charles: '5',
            },
          },
        },
        {
          [IndexedUser.key]: {
            '5': {},
          },
        },
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
      buildInferredResults(
        schema,
        [{ username: 'bob' }],
        {},
        { [IndexedUser.key]: { '5': {} } },
      ),
    ).toEqual({
      pagination: { next: '', previous: '' },
      data: undefined,
    });
    expect(
      buildInferredResults(
        schema,
        [{ hover: 'bob' }],
        {},
        { [IndexedUser.key]: { '5': {} } },
      ),
    ).toEqual({
      pagination: { next: '', previous: '' },
      data: undefined,
    });
  });

  describe('legacy schema', () => {
    class MyEntity extends CoolerArticle {
      static infer(
        args: any[],
        indexes: NormalizedIndex,
        recurse: any,
        entities: any,
      ) {
        if (!args[0]) return;
        let id: undefined | string;
        if (['string', 'number'].includes(typeof args[0])) {
          id = `${args[0]}`;
        } else {
          id = this.pk(args[0], undefined, '', args);
        }
        // Was able to infer the entity's primary key from params
        if (id !== undefined && id !== '' && entities[this.key]?.[id])
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
        buildInferredResults(
          schema,
          ['5'],
          {},
          { [MyEntity.key]: { '5': {} } },
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
      expect(buildInferredResults(schema, ['5'], {}, {})).toEqual({
        data: { article: undefined },
      });
    });
  });
});
