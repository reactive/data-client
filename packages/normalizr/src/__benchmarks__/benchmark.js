import Benchmark from 'benchmark';

import { normalize, denormalize, Entity } from '..';
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

const sch = { project: [ProjectWithBuildTypesDescription] };

const { result, entities } = normalize(data, sch);

suite
  .add('normalizeLong', () => {
    return normalize(data, sch);
  })
  .add('denormalizeLong', () => {
    return denormalize(result, sch, entities);
  })
  .on('cycle', event => {
    // Output benchmark result by converting benchmark result to string
    console.log(String(event.target));
  })
  .run();
