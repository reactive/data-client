import { Entity, schema, Query } from './dist/index.js';

class BuildTypeDescription extends Entity {
  pk() {
    return this.id;
  }

  static key = 'BuildTypeDescription';
}

export class ProjectWithBuildTypesDescription extends Entity {
  pk() {
    return this.id;
  }

  static schema = {
    buildTypes: { buildType: [BuildTypeDescription] },
  };

  static key = 'ProjectWithBuildTypesDescription';
}

export const ProjectSchema = { project: [ProjectWithBuildTypesDescription] };

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
