import Benchmark from 'benchmark';

import addNormlizrSuite from './normalizr';
import addReducerSuite from './reducer';

addReducerSuite(addNormlizrSuite(new Benchmark.Suite()))
  .on('cycle', event => {
    // Output benchmark result by converting benchmark result to string
    console.log(String(event.target));
  })
  .run();
