import { Entity } from '@rest-hooks/endpoint';

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
