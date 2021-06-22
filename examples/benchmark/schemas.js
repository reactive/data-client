import { Entity } from '@rest-hooks/normalizr';

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
