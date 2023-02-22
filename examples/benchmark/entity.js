import data from './data.json' assert { type: 'json' };
import {
  Entity,
  normalize,
  denormalize,
  inferResults,
  WeakEntityMap,
} from './dist/index.js';
import { printStatus } from './printStatus.js';
import {
  ProjectSchema,
  ProjectQuery,
  ProjectQuerySorted,
  BuildTypeDescription,
  BuildTypeDescriptionEntity,
  BuildTypeDescriptionEmpty,
  ProjectWithBuildTypesDescription,
  ProjectWithBuildTypesDescriptionEmpty,
  ProjectWithBuildTypesDescriptionEntity,
} from './schemas.js';

export default function addEntitySuite(suite) {
  return suite
    .add('pk()', () => {
      data.project.forEach(project => {
        ProjectWithBuildTypesDescription.pk(project);
        project.buildTypes.buildType.forEach(buildtype => {
          BuildTypeDescription.pk(buildtype);
        });
      });
    })
    .add('no-defaults pk()', () => {
      data.project.forEach(project => {
        ProjectWithBuildTypesDescriptionEmpty.pk(project);
        project.buildTypes.buildType.forEach(buildtype => {
          BuildTypeDescriptionEmpty.pk(buildtype);
        });
      });
    })
    .add('mixin pk()', () => {
      data.project.forEach(project => {
        ProjectWithBuildTypesDescriptionEntity.pk(project);
        project.buildTypes.buildType.forEach(buildtype => {
          BuildTypeDescriptionEntity.pk(buildtype);
        });
      });
    })
    .add('fromJS()', () => {
      data.project.forEach(project => {
        ProjectWithBuildTypesDescription.fromJS(project);
        project.buildTypes.buildType.forEach(buildtype => {
          BuildTypeDescription.fromJS(buildtype);
        });
      });
    })
    .add('no-defaults fromJS()', () => {
      data.project.forEach(project => {
        ProjectWithBuildTypesDescriptionEmpty.fromJS(project);
        project.buildTypes.buildType.forEach(buildtype => {
          BuildTypeDescriptionEmpty.fromJS(buildtype);
        });
      });
    })
    .add('mixin fromJS()', () => {
      data.project.forEach(project => {
        ProjectWithBuildTypesDescriptionEntity.fromJS(project);
        project.buildTypes.buildType.forEach(buildtype => {
          BuildTypeDescriptionEntity.fromJS(buildtype);
        });
      });
    })
    .on('complete', function () {
      if (process.env.SHOW_OPTIMIZATION) {
        printStatus(Entity.fromJS);
        printStatus(Entity.pk);
        printStatus(ProjectWithBuildTypesDescription.prototype.pk);
        printStatus(Entity.merge);
      }
    });
}
