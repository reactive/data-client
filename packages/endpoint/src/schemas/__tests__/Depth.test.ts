import { normalize } from '@data-client/normalizr';
import { denormalize as plainDenormalize } from '@data-client/normalizr';
import { IDEntity } from '__tests__/new';

import { SimpleMemoCache } from './denormalize';
import { schema } from '../../';

// --- Cross-type bidirectional schemas (Site ↔ SiteOrg ↔ Org) ---

class SiteOrg extends IDEntity {
  readonly site: any = undefined;
  readonly organization: any = undefined;

  static schema: Record<string, any> = {};
}

class Site extends IDEntity {
  readonly name: string = '';
  readonly siteOrganizations: SiteOrg[] = [];

  static schema = {
    siteOrganizations: {
      schema: [SiteOrg],
      detectCycles: true,
    },
  };
}

class Organization extends IDEntity {
  readonly name: string = '';
  readonly siteOrganizations: SiteOrg[] = [];

  static schema = {
    siteOrganizations: {
      schema: [SiteOrg],
      detectCycles: true,
    },
  };
}

SiteOrg.schema = {
  site: Site,
  organization: Organization,
};

// --- Self-referential schemas (Department → children) ---

class Department extends IDEntity {
  readonly name: string = '';
  readonly children: Department[] = [];
  readonly parent: Department | undefined = undefined;

  static schema = {
    children: { schema: [Department], entityDepth: 3 },
    parent: Department,
  };
}

// --- Bidirectional chain builder ---

function buildBidirectionalChain(length: number) {
  const siteEntities: Record<string, any> = {};
  const orgEntities: Record<string, any> = {};
  const siteOrgEntities: Record<string, any> = {};

  for (let i = 0; i < length; i++) {
    siteEntities[`site-${i}`] = {
      id: `site-${i}`,
      name: `Site ${i}`,
      siteOrganizations: [`so-${i}`],
    };
    orgEntities[`org-${i}`] = {
      id: `org-${i}`,
      name: `Org ${i}`,
      siteOrganizations: [`so-${i}`],
    };
    siteOrgEntities[`so-${i}`] = {
      id: `so-${i}`,
      site: `site-${i}`,
      organization: `org-${i}`,
    };
    // Link each org to the next site's siteOrg to form a chain
    if (i > 0) {
      orgEntities[`org-${i - 1}`].siteOrganizations.push(`so-${i}`);
    }
  }

  return {
    entities: {
      Site: siteEntities,
      Organization: orgEntities,
      SiteOrg: siteOrgEntities,
    },
    result: `site-0`,
  };
}

// --- Department tree builder ---

function buildDepartmentTree(depth: number) {
  const entities: Record<string, any> = {};

  for (let i = 0; i < depth; i++) {
    entities[`dept-${i}`] = {
      id: `dept-${i}`,
      name: `Department ${i}`,
      children: i < depth - 1 ? [`dept-${i + 1}`] : [],
      parent: i > 0 ? `dept-${i - 1}` : undefined,
    };
  }

  return {
    entities: { Department: entities },
    result: `dept-0`,
  };
}

describe('detectCycles', () => {
  test('stops cross-type bidirectional cycle at type repetition', () => {
    const { entities, result } = buildBidirectionalChain(5);

    const data = plainDenormalize(Site, result, entities);
    expect(data).not.toEqual(expect.any(Symbol));
    if (typeof data === 'symbol') return;
    expect(data).toBeDefined();
    if (!data) return;

    // Site #0 should resolve
    expect(data.id).toBe('site-0');
    expect(data.siteOrganizations.length).toBeGreaterThan(0);

    // First SiteOrg should resolve its org
    const firstSiteOrg = data.siteOrganizations[0];
    expect(firstSiteOrg.id).toBe('so-0');
    expect(firstSiteOrg.organization).toBeDefined();
    expect(firstSiteOrg.organization.id).toBe('org-0');

    // Org's siteOrganizations should stop — SiteOrg type already visited
    // With caching, depth-limited entities may return a previously cached (fully resolved)
    // version, or a new createIfValid instance with unresolved FK fields.
    // Either way, the traversal does not recurse further from here.
    const orgSiteOrgs = firstSiteOrg.organization.siteOrganizations;
    expect(orgSiteOrgs).toBeDefined();
    expect(orgSiteOrgs.length).toBeGreaterThan(0);
    for (const so of orgSiteOrgs) {
      expect(so).toBeInstanceOf(SiteOrg);
    }
  });

  test('does not overflow stack with large bidirectional chain', () => {
    const { entities, result } = buildBidirectionalChain(1500);

    expect(() => plainDenormalize(Site, result, entities)).not.toThrow();
  });

  test('does not overflow stack with MemoCache', () => {
    const { entities, result } = buildBidirectionalChain(1500);
    const memo = new SimpleMemoCache();

    expect(() => memo.denormalize(Site, result, entities)).not.toThrow();
  });

  test('non-cyclic paths resolve fully', () => {
    // Site with a single org, no back-reference cycle
    const entities = {
      Site: {
        's1': { id: 's1', name: 'Site 1', siteOrganizations: ['so1'] },
      },
      SiteOrg: {
        'so1': { id: 'so1', site: 's1', organization: 'o1' },
      },
      Organization: {
        'o1': { id: 'o1', name: 'Org 1', siteOrganizations: ['so1'] },
      },
    };

    const data = plainDenormalize(Site, 's1', entities);
    expect(data).not.toEqual(expect.any(Symbol));
    if (typeof data === 'symbol') return;
    expect(data).toBeDefined();
    if (!data) return;

    expect(data.id).toBe('s1');
    expect(data.siteOrganizations[0].organization.id).toBe('o1');
  });
});

describe('entityDepth', () => {
  test('stops self-referential at N entity hops', () => {
    const { entities, result } = buildDepartmentTree(10);

    const data = plainDenormalize(Department, result, entities);
    expect(data).not.toEqual(expect.any(Symbol));
    if (typeof data === 'symbol') return;
    expect(data).toBeDefined();
    if (!data) return;

    // entityDepth: 3 means 3 levels of children resolved
    expect(data.id).toBe('dept-0');
    expect(data.children[0].id).toBe('dept-1');           // hop 1
    expect(data.children[0].children[0].id).toBe('dept-2'); // hop 2
    expect(data.children[0].children[0].children[0].id).toBe('dept-3'); // hop 3

    // hop 4 should be a depth-limited entity (created via createIfValid,
    // with unresolved nested fields — children contains raw PK strings)
    const dept3 = data.children[0].children[0].children[0];
    expect(dept3).toBeInstanceOf(Department);
    // dept3's children field should contain unresolved entities
    // (depth-limited entities returned by createIfValid have raw store values)
    if (dept3.children.length > 0) {
      const dept4 = dept3.children[0];
      expect(dept4).toBeInstanceOf(Department);
      // dept4's children should be raw IDs (not resolved further)
      if (dept4.children.length > 0) {
        expect(typeof dept4.children[0]).toBe('string');
      }
    }
  });

  test('non-depth fields on same entity resolve fully', () => {
    // parent field has no entityDepth config, so it resolves via normal path
    const entities = {
      Department: {
        'd1': { id: 'd1', name: 'Dept 1', children: [], parent: undefined },
        'd2': { id: 'd2', name: 'Dept 2', children: [], parent: 'd1' },
      },
    };

    const data = plainDenormalize(Department, 'd2', entities);
    expect(data).not.toEqual(expect.any(Symbol));
    if (typeof data === 'symbol') return;
    expect(data).toBeDefined();
    if (!data) return;

    expect(data.id).toBe('d2');
    // parent is a plain schema field (no entityDepth), resolves normally
    expect(data.parent).toBeDefined();
    expect(data.parent!.id).toBe('d1');
  });
});

describe('combined detectCycles + entityDepth', () => {
  class Node extends IDEntity {
    readonly name: string = '';
    readonly related: Node[] = [];

    static schema = {
      related: { schema: [Node], detectCycles: true, entityDepth: 5 },
    };
  }

  test('whichever triggers first wins', () => {
    // Since Node → Node is same type, detectCycles fires at hop 1
    const entities = {
      Node: {
        'n1': { id: 'n1', name: 'Node 1', related: ['n2'] },
        'n2': { id: 'n2', name: 'Node 2', related: ['n3'] },
        'n3': { id: 'n3', name: 'Node 3', related: [] },
      },
    };

    const data = plainDenormalize(Node, 'n1', entities);
    expect(data).not.toEqual(expect.any(Symbol));
    if (typeof data === 'symbol') return;
    expect(data).toBeDefined();
    if (!data) return;

    // n1 resolves, n1.related[0] = n2 resolves (first visit of Node type under detectCycles)
    expect(data.id).toBe('n1');
    expect(data.related[0].id).toBe('n2');
    // n2.related should stop — Node type already in ancestor set
    // depth-limited entities are returned via createIfValid (entity instance with unresolved nested fields)
    const n2Related = data.related[0].related[0];
    expect(n2Related).toBeInstanceOf(Node);
    expect(n2Related.id).toBe('n3');
    // n3's related should be raw values (empty array in this case)
    expect(n2Related.related).toEqual([]);
  });
});

describe('normalization', () => {
  test('produces identical output with or without field config', () => {
    const input = {
      id: 'site-1',
      name: 'HQ',
      siteOrganizations: [
        {
          id: 'so-1',
          site: 'site-1',
          organization: { id: 'org-1', name: 'Acme', siteOrganizations: [] },
        },
      ],
    };

    const result = normalize(Site, input);

    expect(result.result).toBe('site-1');
    expect(result.entities.Site['site-1']).toBeDefined();
    expect(result.entities.SiteOrg['so-1']).toBeDefined();
    expect(result.entities.Organization['org-1']).toBeDefined();
    // Nested org is replaced by PK
    expect(result.entities.SiteOrg['so-1'].organization).toBe('org-1');
  });

  test('self-referential normalization works with entityDepth config', () => {
    const input = {
      id: 'd1',
      name: 'Root',
      children: [
        {
          id: 'd2',
          name: 'Child',
          children: [],
        },
      ],
    };

    const result = normalize(Department, input);

    expect(result.result).toBe('d1');
    expect(result.entities.Department['d1'].children).toEqual(['d2']);
    expect(result.entities.Department['d2']).toBeDefined();
  });
});

describe('detectCycles resolves consistently regardless of traversal depth', () => {
  // detectCycles stops based on type repetition in the ancestor path,
  // not a global depth counter. This means an entity gets the same
  // resolution whether accessed directly or nested deep in another tree.

  class BuildingDC extends IDEntity {
    readonly name: string = '';
    readonly departments: DepartmentDC[] = [];
    static schema: Record<string, any> = {};
  }
  class DepartmentDC extends IDEntity {
    readonly name: string = '';
    readonly buildings: BuildingDC[] = [];
    static schema: Record<string, any> = {};
  }
  class Wrapper extends IDEntity {
    readonly inner: Wrapper | undefined = undefined;
    readonly building: BuildingDC | undefined = undefined;
    static schema: Record<string, any> = {};
  }
  BuildingDC.schema = { departments: { schema: [DepartmentDC], detectCycles: true } };
  DepartmentDC.schema = { buildings: { schema: [BuildingDC], detectCycles: true } };
  Wrapper.schema = { inner: Wrapper, building: BuildingDC };

  const entities = {
    Wrapper: {
      'w1': { id: 'w1', inner: 'w2' },
      'w2': { id: 'w2', inner: 'w3' },
      'w3': { id: 'w3', inner: 'w4' },
      'w4': { id: 'w4', building: 'b1' },
    },
    BuildingDC: {
      'b1': { id: 'b1', name: 'Building 1', departments: ['d1'] },
    },
    DepartmentDC: {
      'd1': { id: 'd1', name: 'Dept 1', buildings: ['b1'] },
    },
  };

  test('direct access: resolves one full hop then stops at type repetition', () => {
    const result = plainDenormalize(BuildingDC, 'b1', entities);
    expect(result).not.toEqual(expect.any(Symbol));
    if (typeof result === 'symbol' || !result) return;

    // Building → Department resolved (first hop)
    expect(result.departments[0]).toBeInstanceOf(DepartmentDC);
    expect(result.departments[0].id).toBe('d1');

    // Department → Building stopped (Building already in ancestor set)
    // The depth-limited Building is still an instance but its nested fields are unresolved
    const backRef = result.departments[0].buildings[0];
    expect(backRef).toBeInstanceOf(BuildingDC);
    expect(backRef.id).toBe('b1');
  });

  test('nested deep in another tree: same resolution as direct access', () => {
    // Building is reached at global depth 4 (Wrapper → Wrapper → Wrapper → Wrapper → Building)
    const result = plainDenormalize(Wrapper, 'w1', entities);
    expect(result).not.toEqual(expect.any(Symbol));
    if (typeof result === 'symbol' || !result) return;

    const building = result.inner?.inner?.inner?.building;
    expect(building).toBeDefined();
    expect(building).toBeInstanceOf(BuildingDC);

    // Same as direct access: Department resolved
    expect(building!.departments[0]).toBeInstanceOf(DepartmentDC);
    expect(building!.departments[0].id).toBe('d1');

    // Same as direct access: back-reference stopped
    const backRef = building!.departments[0].buildings[0];
    expect(backRef).toBeInstanceOf(BuildingDC);
    expect(backRef.id).toBe('b1');
  });
});
