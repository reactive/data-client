import {
  CoolerArticleResource,
  UnionResource,
  IndexedUserResource,
} from '__tests__/common';
import { schema as schemas } from '@rest-hooks/endpoint';
import { SimpleRecord } from '@rest-hooks/legacy';

import buildInferredResults from '../inferResults';

describe('inferResults()', () => {
  it('should work with Object', () => {
    const schema = new schemas.Object({
      data: new schemas.Object({
        article: CoolerArticleResource,
      }),
    });
    expect(buildInferredResults(schema, [{ id: 5 }], {})).toEqual({
      data: { article: '5' },
    });
  });

  it('should work with SimpleRecord', () => {
    class Data extends SimpleRecord {
      readonly article = CoolerArticleResource.fromJS();
      readonly otherfield = '';
      static schema = {
        article: CoolerArticleResource,
      };
    }
    class Message extends SimpleRecord {
      readonly data = Data.fromJS();
      static schema = {
        data: Data,
      };
    }
    const schema = Message;
    const results = buildInferredResults(schema, [{ id: 5 }], {});
    expect(results).toEqual({
      data: { article: '5' },
    });
  });

  it('should be undefined with Array', () => {
    const schema = {
      data: new schemas.Array(CoolerArticleResource),
    };
    expect(buildInferredResults(schema, [{ id: 5 }], {})).toStrictEqual({
      data: undefined,
    });

    const schema2 = {
      data: [CoolerArticleResource],
    };
    expect(buildInferredResults(schema2, [{ id: 5 }], {})).toStrictEqual({
      data: undefined,
    });
  });

  it('should be undefined with Values', () => {
    const schema = {
      data: new schemas.Values(CoolerArticleResource),
    };
    expect(buildInferredResults(schema, [{ id: 5 }], {})).toStrictEqual({
      data: undefined,
    });
  });

  it('should be undefined with Union and type', () => {
    const schema = UnionResource.detail().schema;
    expect(buildInferredResults(schema, [{ id: 5 }], {})).toBe(undefined);
  });

  it('should work with Union', () => {
    const schema = UnionResource.detail().schema;
    expect(buildInferredResults(schema, [{ id: 5, type: 'first' }], {}))
      .toMatchInlineSnapshot(`
      {
        "id": 5,
        "schema": "first",
      }
    `);
  });

  it('should work with primitive defaults', () => {
    const schema = {
      pagination: { next: '', previous: '' },
      data: CoolerArticleResource,
    };
    expect(buildInferredResults(schema, [{ id: 5 }], {})).toEqual({
      pagination: { next: '', previous: '' },
      data: '5',
    });
  });

  it('should work with indexes', () => {
    const schema = {
      pagination: { next: '', previous: '' },
      data: IndexedUserResource,
    };
    expect(
      buildInferredResults(schema, [{ username: 'bob' }], {
        [IndexedUserResource.key]: {
          username: {
            bob: '5',
          },
        },
      }),
    ).toEqual({
      pagination: { next: '', previous: '' },
      data: '5',
    });
    expect(
      buildInferredResults(schema, [{ username: 'bob', mary: 'five' }], {
        [IndexedUserResource.key]: {
          username: {
            bob: '5',
          },
        },
      }),
    ).toEqual({
      pagination: { next: '', previous: '' },
      data: '5',
    });
  });

  it('should work with indexes but none set', () => {
    const schema = {
      pagination: { next: '', previous: '' },
      data: IndexedUserResource,
    };
    expect(
      buildInferredResults(schema, [{ username: 'bob' }], {
        [IndexedUserResource.key]: {
          username: {
            charles: '5',
          },
        },
      }),
    ).toEqual({
      pagination: { next: '', previous: '' },
      data: undefined,
    });
    expect(
      buildInferredResults(schema, [{ hover: 'bob' }], {
        [IndexedUserResource.key]: {
          username: {
            charles: '5',
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
      data: IndexedUserResource,
    };
    expect(buildInferredResults(schema, [{ username: 'bob' }], {})).toEqual({
      pagination: { next: '', previous: '' },
      data: undefined,
    });
    expect(buildInferredResults(schema, [{ hover: 'bob' }], {})).toEqual({
      pagination: { next: '', previous: '' },
      data: undefined,
    });
  });
});
