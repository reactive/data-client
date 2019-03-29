import { CoolerArticleResource } from '../../__tests__/common';
import { schemas } from '../../resource/normal';
import getEntityPath from '../getEntityPath';

describe('getEntityPath()', () => {
  const entity = CoolerArticleResource.getEntitySchema();
  it('should find base Entity', async () => {
    const path = getEntityPath(entity);

    expect(path).toEqual([]);
  });
  it('should find base array Entity', async () => {
    const path = getEntityPath([entity]);

    expect(path).toEqual([]);
  });
  it('should find schemas.Array(Entity)', async () => {
    const path = getEntityPath(new schemas.Array(entity));

    expect(path).toEqual([]);
  });
  it('should find deeply nested', async () => {
    const path = getEntityPath({
      happy: { go: { lucky: new schemas.Array(entity) } },
    });

    expect(path).toEqual(['happy', 'go', 'lucky']);
  });
  it('should find with red herring', async () => {
    const path = getEntityPath({
      a: null,
      happy: { go: { lucky: new schemas.Array(entity) }, other: 5 },
      more: 10,
      grand: 'four',
      balance: null,
    } as any);

    expect(path).toEqual(['happy', 'go', 'lucky']);
  });
  it('should find deeply nested Object', async () => {
    const scheme = new schemas.Object({
      happy: new schemas.Object({ go: { lucky: new schemas.Array(entity) } }),
    });
    const path = getEntityPath(scheme);

    expect(path).toEqual(['happy', 'go', 'lucky']);
  });
  it('should be false if we never find entity', async () => {
    const path = getEntityPath({ happy: { go: { lucky: 5 } } } as any);

    expect(path).toBe(false);
  });
});
