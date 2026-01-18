import Benchmark from 'benchmark';
import vm from 'node:vm';
import v8 from 'v8';

import addCoreSuite from './core.js';
import addEntitySuite from './entity.js';
import addMicroSuite from './micro.js';
import addNormlizrSuite from './normalizr.js';
import addOldNormlizrSuite from './old-normalizr/normalizr.js';

v8.setFlagsFromString('--expose_gc');
const gc = vm.runInNewContext('gc');

const filter = process.argv[3];

if (process.argv[2] === 'entity') {
  addEntitySuite(new Benchmark.Suite(), filter)
    .on('cycle', event => {
      // Output benchmark result by converting benchmark result to string
      console.log(String(event.target));
      // collect garbage between runs to make results more consistent
      gc();
    })
    .run();
} else if (process.argv[2] === 'normalizr') {
  addNormlizrSuite(new Benchmark.Suite(), filter)
    .on('cycle', event => {
      // Output benchmark result by converting benchmark result to string
      console.log(String(event.target));
      // collect garbage between runs to make results more consistent
      gc();
    })
    .run();
} else if (process.argv[2] === 'core') {
  addCoreSuite(new Benchmark.Suite(), filter)
    .on('cycle', event => {
      // Output benchmark result by converting benchmark result to string
      console.log(String(event.target));
      // collect garbage between runs to make results more consistent
      gc();
    })
    .run();
} else if (process.argv[2] === 'old-normalizr') {
  addOldNormlizrSuite(new Benchmark.Suite(), filter)
    .on('cycle', event => {
      // Output benchmark result by converting benchmark result to string
      console.log(String(event.target));
      // collect garbage between runs to make results more consistent
      gc();
    })
    .run();
} else if (process.argv[2] === 'micro') {
  addMicroSuite(new Benchmark.Suite(), filter)
    .on('cycle', event => {
      // Output benchmark result by converting benchmark result to string
      console.log(String(event.target));
      // collect garbage between runs to make results more consistent
      gc();
    })
    .run();
} else {
  addCoreSuite(addNormlizrSuite(new Benchmark.Suite(), filter), filter)
    .on('cycle', event => {
      // Output benchmark result by converting benchmark result to string
      console.log(String(event.target));
      // collect garbage between runs to make results more consistent
      gc();
    })
    .run();
}
