import { Entity, schema, Query } from './dist/index.js';

export class BuildTypeDescription extends Entity {
  id = '';
  internalId = 'bt17590';
  name = 'Auto build with Scala 2.11';
  type = 'regular';
  paused = false;
  projectId = 'OpenSourceProjects_AbsaOSS_Commons';

  pk() {
    return this.id;
  }

  static key = 'BuildTypeDescription';
}
export class BuildTypeDescriptionEmpty extends Entity {
  pk() {
    return this.id;
  }

  static key = 'BuildTypeDescription';
}
export const BuildTypeDescriptionEntity = schema.Entity(
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

  pk() {
    return this.id;
  }

  static schema = {
    buildTypes: { buildType: [BuildTypeDescription] },
  };

  static key = 'ProjectWithBuildTypesDescription';
}
export class ProjectWithBuildTypesDescriptionEmpty extends Entity {
  pk() {
    return this.id;
  }

  static schema = {
    buildTypes: { buildType: [BuildTypeDescriptionEmpty] },
  };

  static key = 'ProjectWithBuildTypesDescription';
}
export const ProjectWithBuildTypesDescriptionEntity = schema.Entity(
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
export const ProjectSchemaMixin = {
  project: [ProjectWithBuildTypesDescriptionEntity],
};

export const ProjectQuery = {
  project: new schema.All(ProjectWithBuildTypesDescription),
};
export const ProjectQuerySorted = new Query(
  new schema.All(ProjectWithBuildTypesDescription),
  entries => {
    return [...entries].sort((a, b) => a.internalId - b.internalId);
  },
);

class BuildTypeDescriptionSimpleMerge extends Entity {
  pk() {
    return this.id;
  }

  static merge(existing, incoming) {
    return incoming;
  }

  static key = 'BuildTypeDescription';
}

export class ProjectWithBuildTypesDescriptionSimpleMerge extends Entity {
  pk() {
    return this.id;
  }

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
    createdAt: Date,
    updatedAt: Date,
  };

  pk() {
    return this.login;
  }

  static key = 'User';
}
