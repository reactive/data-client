import {
  Entity,
  EntityMixin,
  Values,
  Collection,
  All,
  Query,
  Scalar,
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
