import {
  Entity,
  EntityMixin,
  Values,
  Collection,
  All,
  Query,
  Scalar,
  Controller,
  createReducer,
  initialState,
  Endpoint,
} from './dist/index.js';

export class BuildTypeDescription extends Entity {
  id = '';
  internalId = 'bt17590';
  name = 'Auto build with Scala 2.11';
  type = 'regular';
  paused = false;
  projectId = 'OpenSourceProjects_AbsaOSS_Commons';

  static key = 'BuildTypeDescription';
  pk() {
    return this.id;
  }
}
export class BuildTypeDescriptionEmpty extends Entity {
  static key = 'BuildTypeDescription';
}
export const BuildTypeDescriptionEntity = EntityMixin(
  class {
    id = '';
    internalId = 'bt17590';
    name = 'Auto build with Scala 2.11';
    type = 'regular';
    paused = false;
    projectId = 'OpenSourceProjects_AbsaOSS_Commons';
  },
  {
    pk: 'id',
    key: 'BuildTypeDescription',
  },
);

export class ProjectWithBuildTypesDescription extends Entity {
  id = '';
  internalId = 'project3239';
  name = 'AbsaOSS';
  parentProjectId = 'OpenSourceProjects';
  archived = false;
  buildTypes = {
    buildType: [],
  };

  static schema = {
    buildTypes: { buildType: [BuildTypeDescription] },
  };

  static key = 'ProjectWithBuildTypesDescription';
  pk() {
    return this.id;
  }
}
export class ProjectWithBuildTypesDescriptionEmpty extends Entity {
  static schema = {
    buildTypes: { buildType: [BuildTypeDescriptionEmpty] },
  };

  static key = 'ProjectWithBuildTypesDescription';
}
export const ProjectWithBuildTypesDescriptionEntity = EntityMixin(
  class {
    id = '';
    internalId = 'project3239';
    name = 'AbsaOSS';
    parentProjectId = 'OpenSourceProjects';
    archived = false;
    buildTypes = {
      buildType: [],
    };
  },
  {
    pk: 'id',
    key: 'ProjectWithBuildTypesDescription',
    schema: {
      buildTypes: { buildType: [BuildTypeDescriptionEntity] },
    },
  },
);

export const ProjectSchema = {
  project: [ProjectWithBuildTypesDescription],
};
export const ProjectSchemaValues = {
  project: new Values(ProjectWithBuildTypesDescription),
};
export const ProjectSchemaCollection = {
  project: new Collection([ProjectWithBuildTypesDescription]),
};
export const ProjectSchemaMixin = {
  project: [ProjectWithBuildTypesDescriptionEntity],
};

export const AllProjects = {
  project: new All(ProjectWithBuildTypesDescription),
};
export const getSortedProjects = new Query(
  new All(ProjectWithBuildTypesDescription),
  entries => {
    return [...entries].sort((a, b) => a.name.localeCompare(b.name));
  },
);

export class Stock extends Entity {
  id = '';
  ticker = '';
  exchange = '';
  sector = '';
  industry = '';
  name = '';
  marketCap = 0;
  price = 0;
  pct_equity = 0;
  shares = 0;

  static key = 'Stock';
  pk() {
    return this.id;
  }
}

export const PortfolioScalar = new Scalar({
  lens: args => args[0]?.portfolio,
  key: 'portfolio',
  entity: Stock,
});
Stock.schema = {
  price: PortfolioScalar,
  pct_equity: PortfolioScalar,
  shares: PortfolioScalar,
};

export const StockSchema = {
  stock: [Stock],
};
export const StockScalarValuesSchema = {
  stock: new Values(PortfolioScalar),
};

export function buildStockData(count = 700) {
  const stock = [];
  for (let i = 0; i < count; i++) {
    stock.push({
      id: `s-${i}`,
      ticker: `TKR${i}`,
      exchange: i % 2 ? 'NASDAQ' : 'NYSE',
      sector: `sector-${i % 11}`,
      industry: `industry-${i % 23}`,
      name: `Stock Number ${i}`,
      marketCap: 1_000_000 + i * 137,
      price: 10 + (i % 500) * 0.13,
      pct_equity: ((i % 100) + 1) / 1000,
      shares: 100 + i * 7,
    });
  }
  return { stock };
}

export function buildStockScalarUpdate(count = 700) {
  const stock = {};
  for (let i = 0; i < count; i++) {
    stock[`s-${i}`] = {
      price: 10 + (i % 500) * 0.17,
      pct_equity: ((i % 100) + 2) / 1000,
      shares: 100 + i * 8,
    };
  }
  return { stock };
}

// Degenerate bidirectional chain for #3822 stack overflow testing
export class Department extends Entity {
  id = '';
  name = '';
  buildings = [];

  static key = 'Department';
  pk() {
    return this.id;
  }
}
export class Building extends Entity {
  id = '';
  name = '';
  departments = [];

  static schema = {
    departments: [Department],
  };

  static key = 'Building';
  pk() {
    return this.id;
  }
}
Department.schema = {
  buildings: [Building],
};

export function buildBidirectionalChain(length) {
  const departmentEntities = {};
  const buildingEntities = {};
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
    entities: { Department: departmentEntities, Building: buildingEntities },
    result: 'dept-0',
  };
}

class BuildTypeDescriptionSimpleMerge extends Entity {
  static merge(existing, incoming) {
    return incoming;
  }

  static key = 'BuildTypeDescription';
}

export class ProjectWithBuildTypesDescriptionSimpleMerge extends Entity {
  static schema = {
    buildTypes: { buildType: [BuildTypeDescriptionSimpleMerge] },
  };

  static merge(existing, incoming) {
    return incoming;
  }

  static key = 'ProjectWithBuildTypesDescription';
}

export const ProjectSchemaSimpleMerge = {
  project: [ProjectWithBuildTypesDescriptionSimpleMerge],
};

/* Degenerate-case fixtures for the `spread` suite and memory script.
 *
 * FlatItem has no nested schema, so single-entity writes isolate the
 * store-copy costs (per-type entity map clone in NormalizeDelegate,
 * endpoints/meta spreads in setResponseReducer) from schema traversal.
 */
class FlatItem extends Entity {
  id = '';
  name = '';
  value = 0;
  category = '';
  status = '';
  updatedAt = 0;

  static key = 'FlatItem';
  pk() {
    return this.id;
  }
}

/** Second, small entity type used as a control: writes to it should not
 * scale with the number of FlatItem entities in the store. */
class ControlItem extends Entity {
  id = '';
  name = '';

  static key = 'ControlItem';
  pk() {
    return this.id;
  }
}

const getFlatItems = new Endpoint(() => Promise.resolve([]), {
  schema: [FlatItem],
  key() {
    return '/flatItems';
  },
});
export const getFlatItem = new Endpoint(({ id }) => Promise.resolve({ id }), {
  schema: FlatItem,
  key({ id }) {
    return `/flatItems/${id}`;
  },
});
const getControlItems = new Endpoint(() => Promise.resolve([]), {
  schema: [ControlItem],
  key() {
    return '/controlItems';
  },
});
export const getControlItem = new Endpoint(
  ({ id }) => Promise.resolve({ id }),
  {
    schema: ControlItem,
    key({ id }) {
      return `/controlItems/${id}`;
    },
  },
);

const FlatItemCollection = new Collection([FlatItem]);
const getFlatItemCollection = new Endpoint(() => Promise.resolve([]), {
  schema: FlatItemCollection,
  key() {
    return '/flatItemsCollection';
  },
});
export const pushFlatItems = new Endpoint(() => Promise.resolve([]), {
  schema: FlatItemCollection.push,
  key() {
    return '/flatItemsCollection/push';
  },
});

export function buildFlatItemData(count, offset = 0) {
  const items = [];
  for (let i = 0; i < count; i++) {
    const n = offset + i;
    items.push({
      id: `f-${n}`,
      name: `Item ${n}`,
      value: n * 3,
      category: `cat-${n % 17}`,
      status: n % 2 ? 'active' : 'inactive',
      updatedAt: 1700000000000 + n,
    });
  }
  return items;
}

function buildControlItemData(count) {
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({ id: `c-${i}`, name: `Control ${i}` });
  }
  return items;
}

/** Runs a real setResponse through the reducer and returns the next state. */
function applyResponse(state, endpoint, args, response) {
  const controller = new Controller({});
  const reducer = createReducer(controller);
  let nextState = state;
  controller.dispatch = action => {
    nextState = reducer(nextState, action);
  };
  controller.setResponse(endpoint, ...args, response);
  return nextState;
}

/** State with `n` FlatItem entities plus 10 ControlItem entities. */
export function buildLargeEntityState(n) {
  let state = applyResponse(
    initialState,
    getFlatItems,
    [],
    buildFlatItemData(n),
  );
  state = applyResponse(state, getControlItems, [], buildControlItemData(10));
  return state;
}

/** State with `n` distinct cached endpoint keys. Entity count stays minimal
 * since the endpoints/meta spreads being measured don't depend on it; the
 * synthetic endpoint keys deliberately reference absent FlatItem entities. */
export function buildManyEndpointsState(n) {
  const state = applyResponse(
    initialState,
    getControlItems,
    [],
    buildControlItemData(10),
  );
  const endpoints = { ...state.endpoints };
  const meta = { ...state.meta };
  const date = Date.now();
  for (let i = 0; i < n; i++) {
    const key = getFlatItem.key({ id: `f-${i}` });
    endpoints[key] = `f-${i}`;
    meta[key] = { date, fetchedAt: date, expiresAt: date + 3600_000 };
  }
  return { ...state, endpoints, meta };
}

/** State with a Collection containing `n` FlatItems. */
export function buildCollectionState(n) {
  return applyResponse(
    initialState,
    getFlatItemCollection,
    [],
    buildFlatItemData(n),
  );
}

export class User extends Entity {
  nodeId = '';
  login = '';
  avatarUrl = '';
  gravatarUrl = '';
  gravatarId = '';
  type = 'User';
  siteAdmin = false;
  htmlUrl = '';
  followersUrl = '';
  followingUrl = '';
  gistsUrl = '';
  starredUrl = '';
  subscriptionsUrl = '';
  organizationsUrl = '';
  eventsUrl = '';
  receivedEventsUrl = '';

  name = '';
  company = '';
  blog = '';
  location = '';
  email = '';
  hireable = false;
  bio = '';
  publicRepos = 0;
  publicGists = 0;
  followers = 0;
  following = 0;
  createdAt = new Date(0);
  updatedAt = new Date(0);
  privateGists = 0;
  totalPrivateRepos = 0;
  ownedPrivateRepos = 0;
  collaborators = 0;

  static schema = {
    createdAt: iso => new Date(iso),
    updatedAt: iso => new Date(iso),
  };

  pk() {
    return this.login;
  }

  static key = 'User';
}
