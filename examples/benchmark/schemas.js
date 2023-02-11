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
