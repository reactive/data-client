import { Entity, EntityMixin, schema } from './dist/index.js';

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
  project: new schema.Values(ProjectWithBuildTypesDescription),
};
export const ProjectSchemaCollection = {
  project: new schema.Collection([ProjectWithBuildTypesDescription]),
};
export const ProjectSchemaMixin = {
  project: [ProjectWithBuildTypesDescriptionEntity],
};

export const AllProjects = {
  project: new schema.All(ProjectWithBuildTypesDescription),
};
export const getSortedProjects = new schema.Query(
  new schema.All(ProjectWithBuildTypesDescription),
  entries => {
    return [...entries].sort((a, b) => a.name.localeCompare(b.name));
  },
);

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
