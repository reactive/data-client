// eslint-env jest
/// <reference types="jest" />
import { normalize, MemoCache } from '@data-client/normalizr';
import { denormalize as plainDenormalize } from '@data-client/normalizr';
import { IDEntity } from '__tests__/new';

import { SimpleMemoCache } from './denormalize';
import { schema } from '../..';

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
  readonly floors: number = 1;
}

class Manager extends IDEntity {
  readonly name: string = '';
}

class Department extends IDEntity {
  readonly name: string = '';
  readonly buildings: string[] = [];
  readonly manager: Manager = {} as any;

  static schema = {
    buildings: new schema.Lazy([Building]),
    manager: Manager,
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
  describe('normalize → denormalize round-trip', () => {
    const apiResponse = {
      id: 'dept-1',
      name: 'Engineering',
      manager: { id: 'mgr-1', name: 'Alice' },
      buildings: [
        { id: 'bldg-1', name: 'Building A', floors: 3 },
        { id: 'bldg-2', name: 'Building B', floors: 5 },
      ],
    };

    test('normalize stores entities correctly through Lazy', () => {
      const result = normalize(Department, apiResponse, []);

      expect(result.result).toBe('dept-1');
      expect(Object.keys(result.entities.Building)).toEqual([
        'bldg-1',
        'bldg-2',
      ]);
      expect(result.entities.Building['bldg-1']).toEqual({
        id: 'bldg-1',
        name: 'Building A',
        floors: 3,
      });
      expect(result.entities.Building['bldg-2']).toEqual({
        id: 'bldg-2',
        name: 'Building B',
        floors: 5,
      });
      expect(result.entities.Manager['mgr-1']).toEqual({
        id: 'mgr-1',
        name: 'Alice',
      });
      expect(result.entities.Department['dept-1'].buildings).toEqual([
        'bldg-1',
        'bldg-2',
      ]);
      expect(result.entities.Department['dept-1'].manager).toBe('mgr-1');
    });

    test('denormalize resolves non-Lazy fields but keeps Lazy fields as raw IDs', () => {
      const { result, entities } = normalize(Department, apiResponse, []);
      const dept: any = plainDenormalize(Department, result, entities);

      expect(dept.id).toBe('dept-1');
      expect(dept.name).toBe('Engineering');
      // non-Lazy field Manager is fully resolved
      expect(dept.manager).toBeInstanceOf(Manager);
      expect(dept.manager.id).toBe('mgr-1');
      expect(dept.manager.name).toBe('Alice');
      // Lazy field buildings stays as raw PK array
      expect(dept.buildings).toEqual(['bldg-1', 'bldg-2']);
      expect(typeof dept.buildings[0]).toBe('string');
      expect(typeof dept.buildings[1]).toBe('string');
    });

    test('full pipeline: normalize → parent denorm → LazyQuery resolves', () => {
      const { result, entities } = normalize(Department, apiResponse, []);
      const dept: any = plainDenormalize(Department, result, entities);

      // Parent has raw IDs
      expect(dept.buildings).toEqual(['bldg-1', 'bldg-2']);

      // Use LazyQuery to resolve those IDs into full Building entities
      const memo = new MemoCache();
      const state = { entities, indexes: {} };
      const queryResult = memo.query(
        Department.schema.buildings.query,
        [dept.buildings],
        state,
      );
      const buildings = queryResult.data as any[];
      expect(buildings).toHaveLength(2);
      expect(buildings[0]).toBeInstanceOf(Building);
      expect(buildings[0].id).toBe('bldg-1');
      expect(buildings[0].name).toBe('Building A');
      expect(buildings[0].floors).toBe(3);
      expect(buildings[1]).toBeInstanceOf(Building);
      expect(buildings[1].id).toBe('bldg-2');
      expect(buildings[1].name).toBe('Building B');
      expect(buildings[1].floors).toBe(5);
    });
  });

  describe('normalization', () => {
    test('single entity ref normalizes correctly through Lazy', () => {
      const result = normalize(
        SingleRefDepartment,
        {
          id: 'dept-1',
          name: 'Engineering',
          mainBuilding: { id: 'bldg-1', name: 'HQ', floors: 10 },
        },
        [],
      );
      expect(result.entities.SingleRefDepartment['dept-1'].mainBuilding).toBe(
        'bldg-1',
      );
      expect(result.entities.Building['bldg-1']).toEqual({
        id: 'bldg-1',
        name: 'HQ',
        floors: 10,
      });
    });

    test('normalizing Lazy field with empty array', () => {
      const result = normalize(
        Department,
        {
          id: 'dept-empty',
          name: 'Empty Dept',
          manager: { id: 'mgr-1', name: 'Bob' },
          buildings: [],
        },
        [],
      );
      expect(result.entities.Department['dept-empty'].buildings).toEqual([]);
      expect(result.entities.Building).toBeUndefined();
    });
  });

  describe('denormalization preserves raw IDs', () => {
    const entities = {
      Department: {
        'dept-1': {
          id: 'dept-1',
          name: 'Engineering',
          buildings: ['bldg-1', 'bldg-2'],
          manager: 'mgr-1',
        },
      },
      Building: {
        'bldg-1': { id: 'bldg-1', name: 'Building A', floors: 3 },
        'bldg-2': { id: 'bldg-2', name: 'Building B', floors: 5 },
      },
      Manager: {
        'mgr-1': { id: 'mgr-1', name: 'Alice' },
      },
    };

    test('plainDenormalize keeps Lazy array as string IDs', () => {
      const dept: any = plainDenormalize(Department, 'dept-1', entities);
      expect(dept.buildings).toEqual(['bldg-1', 'bldg-2']);
      expect(dept.buildings[0]).not.toBeInstanceOf(Building);
      // non-Lazy Manager IS resolved
      expect(dept.manager).toBeInstanceOf(Manager);
      expect(dept.manager.name).toBe('Alice');
    });

    test('SimpleMemoCache keeps Lazy array as string IDs', () => {
      const memo = new SimpleMemoCache();
      const dept: any = memo.denormalize(Department, 'dept-1', entities);
      expect(typeof dept).toBe('object');
      expect(dept.buildings).toEqual(['bldg-1', 'bldg-2']);
      expect(dept.manager).toBeInstanceOf(Manager);
    });

    test('single entity Lazy field stays as string PK', () => {
      const singleEntities = {
        SingleRefDepartment: {
          'dept-1': {
            id: 'dept-1',
            name: 'Engineering',
            mainBuilding: 'bldg-1',
          },
        },
        Building: {
          'bldg-1': { id: 'bldg-1', name: 'HQ', floors: 10 },
        },
      };
      const dept: any = plainDenormalize(
        SingleRefDepartment,
        'dept-1',
        singleEntities,
      );
      expect(dept.mainBuilding).toBe('bldg-1');
      expect(typeof dept.mainBuilding).toBe('string');
    });

    test('parent paths exclude lazy entity dependencies', () => {
      const memo = new MemoCache();
      const result = memo.denormalize(Department, 'dept-1', entities);
      expect(result.paths.some(p => p.key === 'Building')).toBe(false);
      expect(result.paths.some(p => p.key === 'Department')).toBe(true);
      // Manager IS in paths because it's a non-Lazy field
      expect(result.paths.some(p => p.key === 'Manager')).toBe(true);
    });
  });

  describe('LazyQuery resolution via .query', () => {
    const state = {
      entities: {
        Department: {
          'dept-1': {
            id: 'dept-1',
            name: 'Engineering',
            buildings: ['bldg-1', 'bldg-2'],
            manager: 'mgr-1',
          },
        },
        Building: {
          'bldg-1': { id: 'bldg-1', name: 'Building A', floors: 3 },
          'bldg-2': { id: 'bldg-2', name: 'Building B', floors: 5 },
          'bldg-3': { id: 'bldg-3', name: 'Building C', floors: 2 },
        },
        Manager: {
          'mgr-1': { id: 'mgr-1', name: 'Alice' },
        },
        SingleRefDepartment: {
          'dept-1': {
            id: 'dept-1',
            name: 'Engineering',
            mainBuilding: 'bldg-1',
          },
        },
      },
      indexes: {},
    };

    test('.query getter always returns the same instance', () => {
      const lazy = Department.schema.buildings;
      expect(lazy.query).toBe(lazy.query);
    });

    test('resolves array of IDs into Building instances', () => {
      const memo = new MemoCache();
      const result = memo.query(
        Department.schema.buildings.query,
        [['bldg-1', 'bldg-2']],
        state,
      );
      const buildings = result.data as any[];
      expect(buildings).toHaveLength(2);
      expect(buildings[0]).toBeInstanceOf(Building);
      expect(buildings[0].id).toBe('bldg-1');
      expect(buildings[0].name).toBe('Building A');
      expect(buildings[0].floors).toBe(3);
      expect(buildings[1]).toBeInstanceOf(Building);
      expect(buildings[1].id).toBe('bldg-2');
      expect(buildings[1].name).toBe('Building B');
      expect(buildings[1].floors).toBe(5);
    });

    test('resolved entities track Building dependencies', () => {
      const memo = new MemoCache();
      const result = memo.query(
        Department.schema.buildings.query,
        [['bldg-1', 'bldg-2']],
        state,
      );
      const buildingPaths = result.paths.filter(p => p.key === 'Building');
      expect(buildingPaths).toHaveLength(2);
      expect(buildingPaths.map(p => p.pk).sort()).toEqual(['bldg-1', 'bldg-2']);
      // Department should NOT be in paths — we're only resolving buildings
      expect(result.paths.some(p => p.key === 'Department')).toBe(false);
    });

    test('subset of IDs resolves only those buildings', () => {
      const memo = new MemoCache();
      const result = memo.query(
        Department.schema.buildings.query,
        [['bldg-3']],
        state,
      );
      const buildings = result.data as any[];
      expect(buildings).toHaveLength(1);
      expect(buildings[0].id).toBe('bldg-3');
      expect(buildings[0].name).toBe('Building C');
      expect(buildings[0].floors).toBe(2);
    });

    test('empty IDs array resolves to empty array', () => {
      const memo = new MemoCache();
      const result = memo.query(Department.schema.buildings.query, [[]], state);
      expect(result.data).toEqual([]);
      expect(result.paths).toEqual([]);
    });

    test('IDs referencing missing entities are filtered out', () => {
      const memo = new MemoCache();
      const result = memo.query(
        Department.schema.buildings.query,
        [['bldg-1', 'nonexistent', 'bldg-2']],
        state,
      );
      const buildings = result.data as any[];
      expect(buildings).toHaveLength(2);
      expect(buildings[0].id).toBe('bldg-1');
      expect(buildings[1].id).toBe('bldg-2');
    });

    test('Entity inner schema: delegates to Building.queryKey for single entity lookup', () => {
      const memo = new MemoCache();
      const result = memo.query(
        SingleRefDepartment.schema.mainBuilding.query,
        [{ id: 'bldg-1' }],
        state,
      );
      const building = result.data as any;
      expect(building).toBeInstanceOf(Building);
      expect(building.id).toBe('bldg-1');
      expect(building.name).toBe('Building A');
      expect(building.floors).toBe(3);
    });

    test('Entity inner schema: missing entity returns undefined', () => {
      const memo = new MemoCache();
      const result = memo.query(
        SingleRefDepartment.schema.mainBuilding.query,
        [{ id: 'nonexistent' }],
        state,
      );
      expect(result.data).toBeUndefined();
    });
  });

  describe('memoization isolation', () => {
    test('parent referential equality is preserved when lazy entity updates', () => {
      const entities1 = {
        Department: {
          'dept-1': {
            id: 'dept-1',
            name: 'Engineering',
            buildings: ['bldg-1'],
            manager: 'mgr-1',
          },
        },
        Building: {
          'bldg-1': { id: 'bldg-1', name: 'Building A', floors: 3 },
        },
        Manager: {
          'mgr-1': { id: 'mgr-1', name: 'Alice' },
        },
      };
      // Building entity changes, Department entity object stays the same ref
      const entities2 = {
        Department: entities1.Department,
        Building: {
          'bldg-1': { id: 'bldg-1', name: 'Building A RENAMED', floors: 4 },
        },
        Manager: entities1.Manager,
      };

      const memo = new MemoCache();
      const result1 = memo.denormalize(Department, 'dept-1', entities1);
      const result2 = memo.denormalize(Department, 'dept-1', entities2);

      // Parent entity denorm is referentially equal — Building change is invisible
      expect(result1.data).toBe(result2.data);
      const dept: any = result1.data;
      expect(dept.name).toBe('Engineering');
      expect(dept.buildings).toEqual(['bldg-1']);
      expect(dept.manager).toBeInstanceOf(Manager);
    });

    test('LazyQuery result DOES update when lazy entity changes', () => {
      const lazyQuery = Department.schema.buildings.query;
      const state1 = {
        entities: {
          Building: {
            'bldg-1': { id: 'bldg-1', name: 'Original', floors: 3 },
          },
        },
        indexes: {},
      };
      const state2 = {
        entities: {
          Building: {
            'bldg-1': { id: 'bldg-1', name: 'Updated', floors: 4 },
          },
        },
        indexes: {},
      };

      const memo = new MemoCache();
      const r1 = memo.query(lazyQuery, [['bldg-1']], state1);
      const r2 = memo.query(lazyQuery, [['bldg-1']], state2);

      expect((r1.data as any)[0].name).toBe('Original');
      expect((r1.data as any)[0].floors).toBe(3);
      expect((r2.data as any)[0].name).toBe('Updated');
      expect((r2.data as any)[0].floors).toBe(4);
      expect(r1.data).not.toBe(r2.data);
    });

    test('LazyQuery result maintains referential equality on unchanged state', () => {
      const lazyQuery = Department.schema.buildings.query;
      const state = {
        entities: {
          Building: {
            'bldg-1': { id: 'bldg-1', name: 'Building A', floors: 3 },
          },
        },
        indexes: {},
      };

      const memo = new MemoCache();
      const r1 = memo.query(lazyQuery, [['bldg-1']], state);
      const r2 = memo.query(lazyQuery, [['bldg-1']], state);
      expect(r1.data).toBe(r2.data);
    });
  });

  describe('nested Lazy fields', () => {
    class Room extends IDEntity {
      readonly label: string = '';
    }

    class LazyBuilding extends IDEntity {
      readonly name: string = '';
      readonly rooms: string[] = [];

      static schema = {
        rooms: new schema.Lazy([Room]),
      };
    }

    class LazyDepartment extends IDEntity {
      readonly name: string = '';
      readonly buildings: string[] = [];

      static schema = {
        buildings: new schema.Lazy([LazyBuilding]),
      };
    }

    test('resolved entity still has its own Lazy fields as raw IDs', () => {
      const state = {
        entities: {
          LazyBuilding: {
            'bldg-1': {
              id: 'bldg-1',
              name: 'Building A',
              rooms: ['room-1', 'room-2'],
            },
          },
          Room: {
            'room-1': { id: 'room-1', label: '101' },
            'room-2': { id: 'room-2', label: '102' },
          },
        },
        indexes: {},
      };

      const memo = new MemoCache();
      const result = memo.query(
        LazyDepartment.schema.buildings.query,
        [['bldg-1']],
        state,
      );
      const buildings = result.data as any[];
      expect(buildings).toHaveLength(1);
      expect(buildings[0]).toBeInstanceOf(LazyBuilding);
      expect(buildings[0].name).toBe('Building A');
      // Building's own Lazy field stays as raw IDs
      expect(buildings[0].rooms).toEqual(['room-1', 'room-2']);
      expect(typeof buildings[0].rooms[0]).toBe('string');
    });

    test('second-level LazyQuery resolves deeper relationships', () => {
      const state = {
        entities: {
          Room: {
            'room-1': { id: 'room-1', label: '101' },
            'room-2': { id: 'room-2', label: '102' },
          },
        },
        indexes: {},
      };

      const memo = new MemoCache();
      const result = memo.query(
        LazyBuilding.schema.rooms.query,
        [['room-1', 'room-2']],
        state,
      );
      const rooms = result.data as any[];
      expect(rooms).toHaveLength(2);
      expect(rooms[0]).toBeInstanceOf(Room);
      expect(rooms[0].label).toBe('101');
      expect(rooms[1].label).toBe('102');
    });
  });

  describe('bidirectional Lazy prevents stack overflow', () => {
    class BidirBuilding extends IDEntity {
      readonly name: string = '';
      readonly departments: string[] = [];
    }
    class BidirDepartment extends IDEntity {
      readonly name: string = '';
      readonly buildings: string[] = [];
    }
    (BidirDepartment as any).schema = {
      buildings: new schema.Lazy([BidirBuilding]),
    };
    (BidirBuilding as any).schema = {
      departments: new schema.Lazy([BidirDepartment]),
    };

    function buildChain(length: number) {
      const departmentEntities: Record<string, any> = {};
      const buildingEntities: Record<string, any> = {};
      for (let i = 0; i < length; i++) {
        departmentEntities[`dept-${i}`] = {
          id: `dept-${i}`,
          name: `Department ${i}`,
          buildings: [`bldg-${i}`],
        };
        buildingEntities[`bldg-${i}`] = {
          id: `bldg-${i}`,
          name: `Building ${i}`,
          departments: i < length - 1 ? [`dept-${i + 1}`] : [],
        };
      }
      return {
        BidirDepartment: departmentEntities,
        BidirBuilding: buildingEntities,
      };
    }

    test('1500-node chain does not overflow (plainDenormalize)', () => {
      const entities = buildChain(1500);
      expect(() =>
        plainDenormalize(BidirDepartment, 'dept-0', entities),
      ).not.toThrow();

      const dept: any = plainDenormalize(BidirDepartment, 'dept-0', entities);
      expect(dept.id).toBe('dept-0');
      expect(dept.name).toBe('Department 0');
      expect(dept.buildings).toEqual(['bldg-0']);
    });

    test('1500-node chain does not overflow (SimpleMemoCache)', () => {
      const entities = buildChain(1500);
      const memo = new SimpleMemoCache();
      expect(() =>
        memo.denormalize(BidirDepartment, 'dept-0', entities),
      ).not.toThrow();
    });

    test('chain entities can still be resolved individually via LazyQuery', () => {
      const entities = buildChain(5);
      const state = { entities, indexes: {} };
      const memo = new MemoCache();

      const deptBuildingsQuery = (
        (BidirDepartment as any).schema.buildings as schema.Lazy<any>
      ).query;
      const bldgDeptsQuery = (
        (BidirBuilding as any).schema.departments as schema.Lazy<any>
      ).query;

      // Resolve dept-0's buildings
      const r = memo.query(deptBuildingsQuery, [['bldg-0']], state);
      const buildings = r.data as any[];
      expect(buildings).toHaveLength(1);
      expect(buildings[0]).toBeInstanceOf(BidirBuilding);
      expect(buildings[0].id).toBe('bldg-0');
      expect(buildings[0].name).toBe('Building 0');
      // Building's departments field is also Lazy — raw IDs
      expect(buildings[0].departments).toEqual(['dept-1']);

      // Resolve building-0's departments
      const r2 = memo.query(bldgDeptsQuery, [['dept-1']], state);
      const depts = r2.data as any[];
      expect(depts).toHaveLength(1);
      expect(depts[0]).toBeInstanceOf(BidirDepartment);
      expect(depts[0].id).toBe('dept-1');
      expect(depts[0].buildings).toEqual(['bldg-1']);
    });
  });

  describe('explicit schema.Array inner schema', () => {
    class ArrayDepartment extends IDEntity {
      readonly name: string = '';
      readonly buildings: string[] = [];

      static schema = {
        buildings: new schema.Lazy(new schema.Array(Building)),
      };
    }

    const state = {
      entities: {
        ArrayDepartment: {
          'dept-1': {
            id: 'dept-1',
            name: 'Engineering',
            buildings: ['bldg-1', 'bldg-2'],
          },
        },
        Building: {
          'bldg-1': { id: 'bldg-1', name: 'Building A', floors: 3 },
          'bldg-2': { id: 'bldg-2', name: 'Building B', floors: 5 },
        },
      },
      indexes: {},
    };

    test('normalize stores entities correctly through Lazy(schema.Array)', () => {
      const result = normalize(
        ArrayDepartment,
        {
          id: 'dept-1',
          name: 'Engineering',
          buildings: [
            { id: 'bldg-1', name: 'Building A', floors: 3 },
            { id: 'bldg-2', name: 'Building B', floors: 5 },
          ],
        },
        [],
      );
      expect(result.entities.ArrayDepartment['dept-1'].buildings).toEqual([
        'bldg-1',
        'bldg-2',
      ]);
      expect(result.entities.Building['bldg-1']).toEqual({
        id: 'bldg-1',
        name: 'Building A',
        floors: 3,
      });
    });

    test('denormalize keeps Lazy(schema.Array) as raw IDs', () => {
      const dept: any = plainDenormalize(
        ArrayDepartment,
        'dept-1',
        state.entities,
      );
      expect(dept.buildings).toEqual(['bldg-1', 'bldg-2']);
      expect(typeof dept.buildings[0]).toBe('string');
    });

    test('LazyQuery resolves explicit schema.Array into Building instances', () => {
      const memo = new MemoCache();
      const result = memo.query(
        ArrayDepartment.schema.buildings.query,
        [['bldg-1', 'bldg-2']],
        state,
      );
      const buildings = result.data as any[];
      expect(buildings).toHaveLength(2);
      expect(buildings[0]).toBeInstanceOf(Building);
      expect(buildings[0].id).toBe('bldg-1');
      expect(buildings[0].name).toBe('Building A');
      expect(buildings[1]).toBeInstanceOf(Building);
      expect(buildings[1].id).toBe('bldg-2');
      expect(buildings[1].name).toBe('Building B');
    });

    test('LazyQuery with empty array resolves to empty for schema.Array', () => {
      const memo = new MemoCache();
      const result = memo.query(
        ArrayDepartment.schema.buildings.query,
        [[]],
        state,
      );
      expect(result.data).toEqual([]);
    });
  });

  describe('explicit schema.Values inner schema', () => {
    class ValuesDepartment extends IDEntity {
      readonly name: string = '';
      readonly buildingMap: Record<string, string> = {};

      static schema = {
        buildingMap: new schema.Lazy(new schema.Values(Building)),
      };
    }

    const state = {
      entities: {
        ValuesDepartment: {
          'dept-1': {
            id: 'dept-1',
            name: 'Engineering',
            buildingMap: { north: 'bldg-1', south: 'bldg-2' },
          },
        },
        Building: {
          'bldg-1': { id: 'bldg-1', name: 'Building A', floors: 3 },
          'bldg-2': { id: 'bldg-2', name: 'Building B', floors: 5 },
        },
      },
      indexes: {},
    };

    test('normalize stores entities correctly through Lazy(schema.Values)', () => {
      const result = normalize(
        ValuesDepartment,
        {
          id: 'dept-1',
          name: 'Engineering',
          buildingMap: {
            north: { id: 'bldg-1', name: 'Building A', floors: 3 },
            south: { id: 'bldg-2', name: 'Building B', floors: 5 },
          },
        },
        [],
      );
      expect(result.entities.ValuesDepartment['dept-1'].buildingMap).toEqual({
        north: 'bldg-1',
        south: 'bldg-2',
      });
    });

    test('denormalize keeps Lazy(schema.Values) as raw IDs', () => {
      const dept: any = plainDenormalize(
        ValuesDepartment,
        'dept-1',
        state.entities,
      );
      expect(dept.buildingMap).toEqual({ north: 'bldg-1', south: 'bldg-2' });
      expect(typeof dept.buildingMap.north).toBe('string');
    });

    test('LazyQuery resolves explicit schema.Values into Building instances', () => {
      const memo = new MemoCache();
      const result = memo.query(
        ValuesDepartment.schema.buildingMap.query,
        [{ north: 'bldg-1', south: 'bldg-2' }],
        state,
      );
      const buildingMap = result.data as any;
      expect(buildingMap.north).toBeInstanceOf(Building);
      expect(buildingMap.north.id).toBe('bldg-1');
      expect(buildingMap.north.name).toBe('Building A');
      expect(buildingMap.south).toBeInstanceOf(Building);
      expect(buildingMap.south.id).toBe('bldg-2');
      expect(buildingMap.south.name).toBe('Building B');
    });
  });

  describe('Lazy.queryKey returns undefined', () => {
    test('Lazy itself is not queryable', () => {
      const lazy = new schema.Lazy([Building]);
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      expect(lazy.queryKey([], () => {}, {} as any)).toBeUndefined();
    });
  });
});
