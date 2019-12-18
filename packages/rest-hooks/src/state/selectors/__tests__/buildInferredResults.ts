import { CoolerArticleResource, UnionResource } from '__tests__/common';

import { schemas } from '../../../resource';
import buildInferredResults from '../buildInferredResults';

describe('buildInferredResults()', () => {
  it('should work with Object', () => {
    const schema = new schemas.Object({
      data: new schemas.Object({
        article: CoolerArticleResource.getEntitySchema(),
      }),
    });
    expect(buildInferredResults(schema, { id: 5 })).toEqual({
      data: { article: '5' },
    });
  });

  it('should be undefined with Array', () => {
    const schema = {
      data: new schemas.Array(CoolerArticleResource.getEntitySchema()),
    };
    expect(buildInferredResults(schema, { id: 5 })).toStrictEqual({
      data: undefined,
    });

    const schema2 = {
      data: [CoolerArticleResource.getEntitySchema()],
    };
    expect(buildInferredResults(schema2, { id: 5 })).toStrictEqual({
      data: undefined,
    });
  });

  it('should be {} with Values', () => {
    const schema = {
      data: new schemas.Values(CoolerArticleResource.getEntitySchema()),
    };
    expect(buildInferredResults(schema, { id: 5 })).toStrictEqual({ data: {} });
  });

  it('should be undefined with Union and type', () => {
    const schema = UnionResource.detailShape().schema;
    expect(buildInferredResults(schema, { id: 5 })).toBe(undefined);
  });

  it('should work with Union', () => {
    const schema = UnionResource.detailShape().schema;
    expect(buildInferredResults(schema, { id: 5, type: 'first' }))
      .toMatchInlineSnapshot(`
      Object {
        "id": "5",
        "schema": "first",
      }
    `);
  });

  it('should work with primitive defaults', () => {
    const schema = {
      pagination: { next: '', previous: '' },
      data: CoolerArticleResource.getEntitySchema(),
    };
    expect(buildInferredResults(schema, { id: 5 })).toEqual({
      pagination: { next: '', previous: '' },
      data: '5',
    });
  });
});
