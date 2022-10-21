import { Entity, schema } from '@rest-hooks/endpoint';

class BuildTypeDescription extends Entity {
  pk() {
    return this.id;
  }
}

class ProjectWithBuildTypesDescription extends Entity {
  pk() {
    return this.id;
  }

  static schema = {
    buildTypes: { buildType: [BuildTypeDescription] },
  };
}

export const ProjectSchema = { project: [ProjectWithBuildTypesDescription] };

export const ProjectQuery = {
  project: new schema.Query(ProjectWithBuildTypesDescription),
};
export const ProjectQuerySorted = {
  project: new schema.Query(ProjectWithBuildTypesDescription, {
    process(entries) {
      return [...entries].sort((a, b) => a.internalId - b.internalId);
    },
  }),
};
