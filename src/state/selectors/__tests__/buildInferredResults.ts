import { CoolerArticleResource } from '../../../__tests__/common';
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
  it('should work with Array', () => {
    const schema = {
      data: new schemas.Array(CoolerArticleResource.getEntitySchema()),
    };
    expect(buildInferredResults(schema, { id: 5 })).toBe(null);
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
