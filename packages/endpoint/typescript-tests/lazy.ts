/* eslint-disable @typescript-eslint/no-unused-vars */
import { IDEntity } from '__tests__/new';

import { useQuery } from '../../react/lib';
import { schema, Collection, Lazy } from '../src';

// --- Entity Definitions ---

class Building extends IDEntity {
  readonly name: string = '';
  readonly floors: number = 1;
}

class Room extends IDEntity {
  readonly label: string = '';
}

class Manager extends IDEntity {
  readonly name: string = '';
}

class User extends IDEntity {
  readonly type = 'user' as const;
}
class Group extends IDEntity {
  readonly type = 'group' as const;
}

// =============================================
// Plain array [Entity]
// =============================================

class DeptWithArray extends IDEntity {
  readonly buildings: string[] = [];
  static schema = {
    buildings: new Lazy([Building]),
  };
}

function usePlainArray() {
  const _buildings: Building[] | undefined = useQuery(
    DeptWithArray.schema.buildings.query,
    ['bldg-1', 'bldg-2'],
  );

  // @ts-expect-error - no args at all
  useQuery(DeptWithArray.schema.buildings.query);

  // @ts-expect-error - too many spread args
  useQuery(DeptWithArray.schema.buildings.query, ['bldg-1'], 'extra');
}

// =============================================
// Single Entity
// =============================================

class DeptWithEntity extends IDEntity {
  readonly mainBuilding: string = '';
  static schema = {
    mainBuilding: new Lazy(Building),
  };
}

function useSingleEntity() {
  const _building: Building | undefined = useQuery(
    DeptWithEntity.schema.mainBuilding.query,
    { id: 'bldg-1' },
  );

  // @ts-expect-error - no args
  useQuery(DeptWithEntity.schema.mainBuilding.query);

  // @ts-expect-error - wrong key (not a valid Building field)
  useQuery(DeptWithEntity.schema.mainBuilding.query, { nonexistent: 'bldg-1' });

  // prettier-ignore
  // @ts-expect-error - too many args
  useQuery(DeptWithEntity.schema.mainBuilding.query, { id: 'bldg-1' }, { id: 'bldg-2' });
}

// =============================================
// schema.Array
// =============================================

class DeptWithSchemaArray extends IDEntity {
  readonly buildings: string[] = [];
  static schema = {
    buildings: new Lazy(new schema.Array(Building)),
  };
}

function useSchemaArray() {
  const _buildings: Building[] | undefined = useQuery(
    DeptWithSchemaArray.schema.buildings.query,
    ['bldg-1', 'bldg-2'],
  );

  // @ts-expect-error - no args
  useQuery(DeptWithSchemaArray.schema.buildings.query);

  // @ts-expect-error - too many args
  useQuery(DeptWithSchemaArray.schema.buildings.query, ['a'], 'extra');
}

// =============================================
// schema.Values
// =============================================

class DeptWithValues extends IDEntity {
  readonly buildingMap: Record<string, string> = {};
  static schema = {
    buildingMap: new Lazy(new schema.Values(Building)),
  };
}

function useSchemaValues() {
  const _valuesResult: Record<string, Building | undefined> | undefined =
    useQuery(DeptWithValues.schema.buildingMap.query, {
      north: 'bldg-1',
      south: 'bldg-2',
    });

  // @ts-expect-error - no args
  useQuery(DeptWithValues.schema.buildingMap.query);

  // @ts-expect-error - too many args
  useQuery(DeptWithValues.schema.buildingMap.query, { a: '1' }, 'extra');
}

// =============================================
// schema.Object
// =============================================

class DeptWithObject extends IDEntity {
  readonly info: { primary: string; secondary: string } = {} as any;
  static schema = {
    info: new Lazy(new schema.Object({ primary: Building, secondary: Room })),
  };
}

function useSchemaObject() {
  const _objectResult:
    | { primary: Building | undefined; secondary: Room | undefined }
    | undefined = useQuery(DeptWithObject.schema.info.query, {
    primary: 'bldg-1',
    secondary: 'rm-1',
  });

  // @ts-expect-error - no args
  useQuery(DeptWithObject.schema.info.query);

  // @ts-expect-error - wrong key (not a member of the Object schema)
  useQuery(DeptWithObject.schema.info.query, { totally_wrong: 'value' });

  // @ts-expect-error - too many args
  useQuery(DeptWithObject.schema.info.query, { id: '1' }, { id: '2' });
}

// =============================================
// Collection (default args)
// =============================================

const buildingsCollection = new Collection([Building]);
class DeptWithCollection extends IDEntity {
  static schema = {
    buildings: new Lazy(buildingsCollection),
  };
}

function useCollectionDefaultArgs() {
  const _buildings: Building[] | undefined = useQuery(
    DeptWithCollection.schema.buildings.query,
    { departmentId: '1' },
  );

  // DefaultArgs allows [], [Record], [Record, any] — these are valid by design
  useQuery(DeptWithCollection.schema.buildings.query);
  useQuery(
    DeptWithCollection.schema.buildings.query,
    { departmentId: '1' },
    'extra',
  );
}

// =============================================
// Collection (typed args)
// =============================================

const typedCollection = new Collection([Building], {
  argsKey: (urlParams: { departmentId: string }) => ({
    departmentId: urlParams.departmentId,
  }),
});
class DeptWithTypedCollection extends IDEntity {
  static schema = {
    buildings: new Lazy(typedCollection),
  };
}

function useCollectionTypedArgs() {
  const _buildings: Building[] | undefined = useQuery(
    DeptWithTypedCollection.schema.buildings.query,
    { departmentId: '1' },
  );

  // @ts-expect-error - no args
  useQuery(DeptWithTypedCollection.schema.buildings.query);

  // @ts-expect-error - wrong arg shape (missing required key)
  useQuery(DeptWithTypedCollection.schema.buildings.query, { wrongKey: '1' });

  // prettier-ignore
  // @ts-expect-error - too many args
  useQuery(DeptWithTypedCollection.schema.buildings.query, { departmentId: '1' }, 'extra');
}

// =============================================
// schema.All
// =============================================

class DeptWithAll extends IDEntity {
  static schema = {
    allBuildings: new Lazy(new schema.All(Building)),
  };
}

function useSchemaAll() {
  const _allBuildings: Building[] | undefined = useQuery(
    DeptWithAll.schema.allBuildings.query,
    ['bldg-1', 'bldg-2'],
  );

  // @ts-expect-error - no args
  useQuery(DeptWithAll.schema.allBuildings.query);

  // @ts-expect-error - too many args
  useQuery(DeptWithAll.schema.allBuildings.query, 'a', 'b');
}

// =============================================
// Union
// =============================================

const ownerUnion = new schema.Union({ user: User, group: Group }, 'type');
class DeptWithUnion extends IDEntity {
  readonly owner: string = '';
  static schema = {
    owner: new Lazy(ownerUnion),
  };
}

function useUnion() {
  const _unionResult: User | Group | undefined = useQuery(
    DeptWithUnion.schema.owner.query,
    { id: 'usr-1', schema: 'user' },
  );

  // @ts-expect-error - no args
  useQuery(DeptWithUnion.schema.owner.query);

  // @ts-expect-error - wrong key (not a UnionResult field)
  useQuery(DeptWithUnion.schema.owner.query, { wrong: 'user' });

  // @ts-expect-error - too many args
  useQuery(DeptWithUnion.schema.owner.query, { type: 'user' }, 'extra');
}

// =============================================
// Plain object literal { key: Entity }
// =============================================

class DeptWithPlainObject extends IDEntity {
  readonly refs: { building: string; room: string } = {} as any;
  static schema = {
    refs: new Lazy({ building: Building, room: Room }),
  };
}

function usePlainObject() {
  const _plainObjResult:
    | { building: Building | undefined; room: Room | undefined }
    | undefined = useQuery(DeptWithPlainObject.schema.refs.query, {
    building: 'bldg-1',
    room: 'rm-1',
  });

  // @ts-expect-error - no args
  useQuery(DeptWithPlainObject.schema.refs.query);

  // @ts-expect-error - wrong key (not a member of the plain object schema)
  useQuery(DeptWithPlainObject.schema.refs.query, { nonexistent: '1' });

  // @ts-expect-error - too many args
  useQuery(DeptWithPlainObject.schema.refs.query, { id: '1' }, { id: '2' });
}
