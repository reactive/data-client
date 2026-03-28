import { normalize, MemoCache } from '@data-client/normalizr';
import { denormalize as plainDenormalize } from '@data-client/normalizr';
import { IDEntity } from '__tests__/new';

import { SimpleMemoCache } from './denormalize';
import { schema } from '../..';
import Entity from '../Entity';

let dateSpy: jest.Spied<any>;
beforeAll(() => {
  dateSpy = jest
    .spyOn(global.Date, 'now')
    .mockImplementation(() => new Date('2019-05-14T11:01:58.135Z').valueOf());
});
afterAll(() => {
  dateSpy.mockRestore();
});

class Building extends IDEntity {
  readonly name: string = '';
}

class Department extends IDEntity {
  readonly name: string = '';
  readonly buildings: string[] = [];

  static schema = {
    buildings: new schema.Lazy([Building]),
  };
}

class SingleRefDepartment extends IDEntity {
  readonly name: string = '';
  readonly mainBuilding: string = '';

  static schema = {
    mainBuilding: new schema.Lazy(Building),
  };
}

describe('Lazy schema', () => {
  const sampleData = {
    id: 'dept-1',
    name: 'Engineering',
    buildings: [
      { id: 'bldg-1', name: 'Building A' },
      { id: 'bldg-2', name: 'Building B' },
    ],
  };

  describe('normalization', () => {
    test('normalizes inner entities through Lazy wrapper', () => {
      const result = normalize(Department, sampleData, []);
      expect(result.result).toBe('dept-1');
      expect(result.entities.Department['dept-1']).toEqual({
        id: 'dept-1',
        name: 'Engineering',
        buildings: ['bldg-1', 'bldg-2'],
      });
      expect(result.entities.Building['bldg-1']).toEqual({
        id: 'bldg-1',
        name: 'Building A',
      });
      expect(result.entities.Building['bldg-2']).toEqual({
        id: 'bldg-2',
        name: 'Building B',
      });
    });

    test('normalizes single entity through Lazy wrapper', () => {
      const result = normalize(
        SingleRefDepartment,
        {
          id: 'dept-1',
          name: 'Engineering',
          mainBuilding: { id: 'bldg-1', name: 'HQ' },
        },
        [],
      );
      expect(result.result).toBe('dept-1');
      expect(result.entities.SingleRefDepartment['dept-1'].mainBuilding).toBe(
        'bldg-1',
      );
      expect(result.entities.Building['bldg-1']).toEqual({
        id: 'bldg-1',
        name: 'HQ',
      });
    });
  });

  describe('denormalization', () => {
    const entities = {
      Department: {
        'dept-1': {
          id: 'dept-1',
          name: 'Engineering',
          buildings: ['bldg-1', 'bldg-2'],
        },
      },
      Building: {
        'bldg-1': { id: 'bldg-1', name: 'Building A' },
        'bldg-2': { id: 'bldg-2', name: 'Building B' },
      },
    };

    test('Lazy field leaves raw IDs unchanged (plainDenormalize)', () => {
      const dept: any = plainDenormalize(Department, 'dept-1', entities);
      expect(dept).toBeDefined();
      expect(dept.buildings).toEqual(['bldg-1', 'bldg-2']);
      expect(typeof dept.buildings[0]).toBe('string');
    });

    test('Lazy field leaves raw IDs unchanged (SimpleMemoCache)', () => {
      const memo = new SimpleMemoCache();
      const dept: any = memo.denormalize(Department, 'dept-1', entities);
      expect(dept).toBeDefined();
      expect(dept.buildings).toEqual(['bldg-1', 'bldg-2']);
      expect(typeof dept.buildings[0]).toBe('string');
    });

    test('single entity Lazy field leaves raw PK', () => {
      const singleEntities = {
        SingleRefDepartment: {
          'dept-1': {
            id: 'dept-1',
            name: 'Engineering',
            mainBuilding: 'bldg-1',
          },
        },
        Building: {
          'bldg-1': { id: 'bldg-1', name: 'HQ' },
        },
      };
      const dept: any = plainDenormalize(
        SingleRefDepartment,
        'dept-1',
        singleEntities,
      );
      expect(dept.mainBuilding).toBe('bldg-1');
    });

    test('parent denormalization does not track lazy entity dependencies', () => {
      const memo = new MemoCache();
      const result1 = memo.denormalize(
        Department,
        'dept-1',
        entities,
      );
      expect(result1.data).toBeDefined();
      const deptPaths = result1.paths;
      const buildingPaths = deptPaths.filter(p => p.key === 'Building');
      expect(buildingPaths).toHaveLength(0);
      const deptPaths2 = deptPaths.filter(p => p.key === 'Department');
      expect(deptPaths2).toHaveLength(1);
    });
  });

  describe('.query (LazyQuery)', () => {
    const state = {
      entities: {
        Department: {
          'dept-1': {
            id: 'dept-1',
            name: 'Engineering',
            buildings: ['bldg-1', 'bldg-2'],
          },
        },
        Building: {
          'bldg-1': { id: 'bldg-1', name: 'Building A' },
          'bldg-2': { id: 'bldg-2', name: 'Building B' },
        },
      },
      indexes: {},
    };

    test('.query returns a LazyQuery instance', () => {
      const lazyField = Department.schema.buildings;
      expect(lazyField).toBeInstanceOf(schema.Lazy);
      expect(lazyField.query).toBeDefined();
      expect(lazyField.query.queryKey).toBeInstanceOf(Function);
      expect(lazyField.query.denormalize).toBeInstanceOf(Function);
    });

    test('.query getter returns same instance', () => {
      const lazyField = Department.schema.buildings;
      expect(lazyField.query).toBe(lazyField.query);
    });

    test('LazyQuery resolves array of IDs via MemoCache.query', () => {
      const lazyQuery = Department.schema.buildings.query;
      const memo = new MemoCache();
      const result = memo.query(lazyQuery, [['bldg-1', 'bldg-2']], state);
      expect(result.data).toBeDefined();
      if (typeof result.data === 'symbol') return;
      const buildings = result.data as any[];
      expect(buildings).toHaveLength(2);
      expect(buildings[0].id).toBe('bldg-1');
      expect(buildings[0].name).toBe('Building A');
      expect(buildings[1].id).toBe('bldg-2');
      expect(buildings[1].name).toBe('Building B');
    });

    test('LazyQuery tracks Building entity dependencies', () => {
      const lazyQuery = Department.schema.buildings.query;
      const memo = new MemoCache();
      const result = memo.query(lazyQuery, [['bldg-1', 'bldg-2']], state);
      const buildingPaths = result.paths.filter(p => p.key === 'Building');
      expect(buildingPaths.length).toBeGreaterThanOrEqual(2);
    });

    test('LazyQuery with Entity inner schema delegates queryKey', () => {
      const lazyField = SingleRefDepartment.schema.mainBuilding;
      const lazyQuery = lazyField.query;
      const memo = new MemoCache();
      const result = memo.query(lazyQuery, [{ id: 'bldg-1' }], state);
      expect(result.data).toBeDefined();
      if (typeof result.data === 'symbol') return;
      expect((result.data as any).id).toBe('bldg-1');
      expect((result.data as any).name).toBe('Building A');
    });

    test('LazyQuery returns undefined for missing entity', () => {
      const lazyQuery = SingleRefDepartment.schema.mainBuilding.query;
      const memo = new MemoCache();
      const result = memo.query(lazyQuery, [{ id: 'nonexistent' }], state);
      expect(result.data).toBeUndefined();
    });

    test('LazyQuery returns empty array for empty IDs', () => {
      const lazyQuery = Department.schema.buildings.query;
      const memo = new MemoCache();
      const result = memo.query(lazyQuery, [[]], state);
      expect(result.data).toEqual([]);
    });
  });

  describe('memoization isolation', () => {
    test('parent memo is stable when lazy entity changes', () => {
      const entities1 = {
        Department: {
          'dept-1': {
            id: 'dept-1',
            name: 'Engineering',
            buildings: ['bldg-1'],
          },
        },
        Building: {
          'bldg-1': { id: 'bldg-1', name: 'Building A' },
        },
      };
      const entities2 = {
        Department: entities1.Department,
        Building: {
          'bldg-1': { id: 'bldg-1', name: 'Building A UPDATED' },
        },
      };

      const memo = new MemoCache();
      const result1 = memo.denormalize(Department, 'dept-1', entities1);
      const result2 = memo.denormalize(Department, 'dept-1', entities2);
      expect(result1.data).toBe(result2.data);
    });
  });

  describe('does not overflow stack with large bidirectional graphs', () => {
    test('large chain with Lazy fields does not overflow', () => {
      class LazyDepartment extends IDEntity {
        readonly name: string = '';
        readonly buildings: string[] = [];
      }
      class LazyBuilding extends IDEntity {
        readonly name: string = '';
        readonly departments: string[] = [];
      }
      LazyDepartment.schema = {
        buildings: new schema.Lazy([LazyBuilding]),
      };
      LazyBuilding.schema = {
        departments: new schema.Lazy([LazyDepartment]),
      };

      const CHAIN_LENGTH = 1500;
      const departmentEntities: Record<string, any> = {};
      const buildingEntities: Record<string, any> = {};

      for (let i = 0; i < CHAIN_LENGTH; i++) {
        departmentEntities[`dept-${i}`] = {
          id: `dept-${i}`,
          name: `Department ${i}`,
          buildings: [`bldg-${i}`],
        };
        buildingEntities[`bldg-${i}`] = {
          id: `bldg-${i}`,
          name: `Building ${i}`,
          departments: i < CHAIN_LENGTH - 1 ? [`dept-${i + 1}`] : [],
        };
      }

      const entities = {
        LazyDepartment: departmentEntities,
        LazyBuilding: buildingEntities,
      };

      expect(() =>
        plainDenormalize(LazyDepartment, 'dept-0', entities),
      ).not.toThrow();

      const memo = new SimpleMemoCache();
      expect(() =>
        memo.denormalize(LazyDepartment, 'dept-0', entities),
      ).not.toThrow();

      const dept: any = plainDenormalize(LazyDepartment, 'dept-0', entities);
      expect(dept.buildings).toEqual(['bldg-0']);
      expect(typeof dept.buildings[0]).toBe('string');
    });
  });
});
