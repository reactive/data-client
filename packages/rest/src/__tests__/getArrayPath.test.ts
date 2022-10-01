import { CoolerArticle } from '__tests__/new';

import { schema } from '..';
import getArrayPath from '../getArrayPath';

describe('getArrayPath()', () => {
  it('should be false when there is no array', () => {
    expect(getArrayPath({ data: 5 })).toBe(false);
    expect(getArrayPath({ data: 5, other: undefined, stringer: 'hi' })).toBe(
      false,
    );
  });
  it('should find entity inside pojo', () => {
    expect(
      getArrayPath({ data: 5, right: [CoolerArticle], stringer: 'hi' }),
    ).toStrictEqual(['right']);
  });
  it('should find entity inside schema.Object', () => {
    expect(
      getArrayPath(
        new schema.Object({ data: 5, right: [CoolerArticle], stringer: 'hi' }),
      ),
    ).toStrictEqual(['right']);
  });
  it('should be false when has entity but no array', () => {
    expect(
      getArrayPath({ data: 5, right: CoolerArticle, stringer: 'hi' }),
    ).toStrictEqual(false);
  });
});
