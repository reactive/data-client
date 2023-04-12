import { schema } from 'normalizr';

export const BuildTypeDescription = new schema.Entity('BuildTypeDescription');

export const BuildTypeDescriptionEntity = new schema.Entity(
  'BuildTypeDescription',
);

export const ProjectWithBuildTypesDescription = new schema.Entity(
  'ProjectWithBuildTypesDescription',
  {
    buildTypes: { buildType: [BuildTypeDescription] },
  },
);

export const ProjectSchema = {
  project: [ProjectWithBuildTypesDescription],
};

export const User = new schema.Entity('User', {}, { idAttribute: 'login' });
