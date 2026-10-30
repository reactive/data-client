/// <reference types="jest" />
import { touches, type Change } from '../store/actionGroups';
import { endpointId, entityId } from '../store/model';
import { ENDPOINTS, tableList } from '../store/nav';

const endpointChange: Change = {
  kind: 'updated',
  id: endpointId('GET /posts'),
  endpoint: 'GET /posts',
};
const rowChange: Change = {
  kind: 'updated',
  id: entityId('Post', '1'),
  table: 'Post',
  pk: '1',
};

describe('touches', () => {
  it('counts an endpoint change, not a row change, for the Endpoints list', () => {
    expect(touches(ENDPOINTS, endpointChange)).toBe(true);
    expect(touches(ENDPOINTS, rowChange)).toBe(false);
  });

  it("counts a table's row changes for its list", () => {
    expect(touches(tableList('Post'), rowChange)).toBe(true);
    expect(touches(tableList('User'), rowChange)).toBe(false);
    expect(touches(tableList('Post'), endpointChange)).toBe(false);
  });

  it('counts only the rows a list of pks names', () => {
    const posts = (...pks: string[]) => ({ ...tableList('Post'), pks });
    expect(touches(posts('1'), rowChange)).toBe(true);
    expect(touches(posts('2'), rowChange)).toBe(false);
  });
});
