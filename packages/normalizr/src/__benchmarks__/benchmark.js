import Benchmark from 'benchmark';

import { normalize, Entity } from '..';
import data from './data.json';
const suite = new Benchmark.Suite();

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

suite
  .add('normalizeLong', () => {
    return normalize(data.project, [ProjectWithBuildTypesDescription]);
  })
  .on('cycle', event => {
    // Output benchmark result by converting benchmark result to string
    console.log(String(event.target));
  })
  .run();
