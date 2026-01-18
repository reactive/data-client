import { createAdd } from './filter.js';
import { printStatus } from './printStatus.js';

/**
 * Microbenchmark suite for testing very specific, isolated operations.
 *
 * Tests 6 optimization patterns:
 * 1. forEach vs indexed for loop
 * 2. reduce+spread vs direct mutation
 * 3. array.map vs pre-allocated loop
 * 4. repeated getter vs cached
 * 5. slice+map vs pre-allocated extraction
 * 6. Map double-get vs single-get
 *
 * @param {import('benchmark').Suite} suite
 * @param {string} [filter]
 * @returns {import('benchmark').Suite}
 */
export default function addMicroSuite(suite, filter) {
  const add = createAdd(suite, filter);

  // ============================================================
  // Setup: Create test data structures
  // ============================================================

  // Object with 10 keys for forEach/reduce tests
  const testObject = {
    key0: 'value0',
    key1: 'value1',
    key2: 'value2',
    key3: 'value3',
    key4: 'value4',
    key5: 'value5',
    key6: 'value6',
    key7: 'value7',
    key8: 'value8',
    key9: 'value9',
  };

  // Array with 100 items for map/prealloc tests
  const testArray = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    value: `item${i}`,
  }));

  // Simulated rest args for slice+map tests (typical Controller usage: 3-5 args + state)
  const mockState = { entities: {}, endpoints: {} };
  const restArgs = [{ id: 1 }, { filter: 'active' }, 'someKey', mockState];

  // Map for double-get tests
  const testMap = new Map();
  // Pre-populate with some keys to test both hit and miss cases
  for (let i = 0; i < 50; i++) {
    testMap.set(`existing${i}`, { data: i });
  }

  // Class with getter for getter caching tests
  class WithGetter {
    constructor() {
      this._schemaAttribute = null;
      this.schema = { type: 'test' };
    }

    get isSingleSchema() {
      return !this._schemaAttribute;
    }
  }
  const getterInstance = new WithGetter();

  // Transform function for map/slice tests (simulates ensurePojo)
  const transform = x => (x && typeof x === 'object' ? { ...x } : x);

  // ============================================================
  // Optimization 1: forEach vs Indexed For Loop
  // ============================================================

  // BEFORE: Object.keys().forEach()
  function forEachPattern(obj, schema) {
    const result = { ...obj };
    Object.keys(schema).forEach(key => {
      const value = schema[key];
      if (value !== undefined) {
        result[key] = value;
      }
    });
    return result;
  }

  // AFTER: Indexed for loop
  function forLoopPattern(obj, schema) {
    const result = { ...obj };
    const keys = Object.keys(schema);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const value = schema[k];
      if (value !== undefined) {
        result[k] = value;
      }
    }
    return result;
  }

  add('1-forEach (10 keys)', () => {
    for (let i = 0; i < 1000; i++) {
      forEachPattern({}, testObject);
    }
  });

  add('1-forLoop (10 keys)', () => {
    for (let i = 0; i < 1000; i++) {
      forLoopPattern({}, testObject);
    }
  });

  // ============================================================
  // Optimization 2: Reduce with Spreading vs Direct Mutation
  // ============================================================

  // BEFORE: reduce with spreading
  function reduceSpreadPattern(input) {
    return Object.keys(input).reduce((output, key) => {
      const value = input[key];
      return value !== undefined && value !== null ?
          { ...output, [key]: value }
        : output;
    }, {});
  }

  // AFTER: direct mutation
  function directMutationPattern(input) {
    const output = {};
    const keys = Object.keys(input);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const value = input[k];
      if (value !== undefined && value !== null) {
        output[k] = value;
      }
    }
    return output;
  }

  add('2-reduceSpread (10 keys)', () => {
    for (let i = 0; i < 1000; i++) {
      reduceSpreadPattern(testObject);
    }
  });

  add('2-directMutation (10 keys)', () => {
    for (let i = 0; i < 1000; i++) {
      directMutationPattern(testObject);
    }
  });

  // ============================================================
  // Optimization 3: Array.map vs Pre-allocated Loop
  // ============================================================

  // BEFORE: array.map
  function arrayMapPattern(arr, fn) {
    return arr.map(fn);
  }

  // AFTER: pre-allocated loop
  function preallocPattern(arr, fn) {
    const result = new Array(arr.length);
    for (let i = 0; i < arr.length; i++) {
      result[i] = fn(arr[i]);
    }
    return result;
  }

  const mapFn = item => ({ ...item, processed: true });

  add('3-arrayMap (100 items)', () => {
    arrayMapPattern(testArray, mapFn);
  });

  add('3-prealloc (100 items)', () => {
    preallocPattern(testArray, mapFn);
  });

  // ============================================================
  // Optimization 4: Repeated Getter vs Cached
  // ============================================================

  // BEFORE: repeated getter access
  function repeatedGetterPattern(instance) {
    let result = 0;
    for (let i = 0; i < 1000; i++) {
      if (instance.isSingleSchema) {
        result += 1;
      }
      if (instance.isSingleSchema) {
        result += 2;
      }
      if (instance.isSingleSchema) {
        result += 3;
      }
    }
    return result;
  }

  // AFTER: cached getter
  function cachedGetterPattern(instance) {
    let result = 0;
    const isSingle = instance.isSingleSchema;
    for (let i = 0; i < 1000; i++) {
      if (isSingle) {
        result += 1;
      }
      if (isSingle) {
        result += 2;
      }
      if (isSingle) {
        result += 3;
      }
    }
    return result;
  }

  add('4-getterRepeated (3x per 1000 iter)', () => {
    repeatedGetterPattern(getterInstance);
  });

  add('4-getterCached (3x per 1000 iter)', () => {
    cachedGetterPattern(getterInstance);
  });

  // ============================================================
  // Optimization 5: Slice+Map vs Pre-allocated Extraction
  // ============================================================

  // BEFORE: slice + map
  function sliceMapPattern(rest) {
    const state = rest[rest.length - 1];
    const args = rest.slice(0, rest.length - 1).map(transform);
    return [state, args];
  }

  // AFTER: pre-allocated indexed extraction
  function preallocExtractPattern(rest) {
    const l = rest.length;
    const args = new Array(l - 1);
    for (let i = 0; i < l - 1; i++) {
      args[i] = transform(rest[i]);
    }
    return [rest[l - 1], args];
  }

  add('5-sliceMap (4 args)', () => {
    for (let i = 0; i < 1000; i++) {
      sliceMapPattern(restArgs);
    }
  });

  add('5-preallocExtract (4 args)', () => {
    for (let i = 0; i < 1000; i++) {
      preallocExtractPattern(restArgs);
    }
  });

  // ============================================================
  // Optimization 6: Map Double-Get vs Single-Get
  // ============================================================

  // BEFORE: double get pattern
  function doubleGetPattern(map, key, createValue) {
    if (!map.get(key)) {
      map.set(key, createValue());
    }
    return map.get(key);
  }

  // AFTER: single get pattern
  function singleGetPattern(map, key, createValue) {
    let value = map.get(key);
    if (!value) {
      value = createValue();
      map.set(key, value);
    }
    return value;
  }

  const createValue = () => ({ data: [] });

  add('6-mapDoubleGet (50% miss)', () => {
    const map = new Map(testMap); // Clone to reset state
    for (let i = 0; i < 1000; i++) {
      // 50% existing keys, 50% new keys
      const key = i % 2 === 0 ? `existing${i % 50}` : `new${i}`;
      doubleGetPattern(map, key, createValue);
    }
  });

  add('6-mapSingleGet (50% miss)', () => {
    const map = new Map(testMap); // Clone to reset state
    for (let i = 0; i < 1000; i++) {
      // 50% existing keys, 50% new keys
      const key = i % 2 === 0 ? `existing${i % 50}` : `new${i}`;
      singleGetPattern(map, key, createValue);
    }
  });

  // ============================================================
  // Completion handler with V8 optimization status
  // ============================================================

  return suite.on('complete', function () {
    if (process.env.SHOW_OPTIMIZATION) {
      console.error('\n=== V8 Optimization Status ===\n');

      console.error('Optimization 1: forEach vs forLoop');
      printStatus(forEachPattern);
      printStatus(forLoopPattern);

      console.error('Optimization 2: reduce vs mutation');
      printStatus(reduceSpreadPattern);
      printStatus(directMutationPattern);

      console.error('Optimization 3: map vs prealloc');
      printStatus(arrayMapPattern);
      printStatus(preallocPattern);

      console.error('Optimization 4: getter patterns');
      printStatus(repeatedGetterPattern);
      printStatus(cachedGetterPattern);

      console.error('Optimization 5: slice+map vs indexed');
      printStatus(sliceMapPattern);
      printStatus(preallocExtractPattern);

      console.error('Optimization 6: map get patterns');
      printStatus(doubleGetPattern);
      printStatus(singleGetPattern);

      console.error('\nmicro bench complete\n');
    }
  });
}
