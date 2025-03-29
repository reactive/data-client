import { Temporal } from '@js-temporal/polyfill';

import { getEntities } from '../denormalize/getEntities';
import WeakDependencyMap from '../memo/WeakDependencyMap';
import { EntityPath } from '../types';

describe('WeakDependencyMap', () => {
  const a = { hi: '5' };
  const b = [1, 2, 3];
  const c = Temporal.Instant.fromEpochMilliseconds(0);
  const state: Record<string, Record<string, object>> = {
    A: {
      '1': a,
    },
    B: {
      '2': b,
    },
    C: {
      '3': c,
    },
  };
  const getEntity = getEntities(state);
  const depA = { path: { key: 'A', pk: '1' }, entity: a };
  const depB = { path: { key: 'B', pk: '2' }, entity: b };
  const depC = { path: { key: 'C', pk: '3' }, entity: c };

  it('should construct', () => {
    const wem = new WeakDependencyMap<EntityPath>();
  });

  it('should set one item', () => {
    const wem = new WeakDependencyMap<EntityPath>();
    const deps = [depA];
    wem.set(deps, 'myvalue');

    expect(wem.get(a, getEntity)[0]).toBe('myvalue');

    expect(wem.get(b, getEntity)[0]).toBeUndefined();
    expect(wem.get(c, getEntity)[0]).toBeUndefined();
  });

  it('should set multiple on same path', () => {
    const wem = new WeakDependencyMap<EntityPath>();
    const attempts = [
      { key: [depA], value: 'first' },
      {
        key: [depA, depB],
        value: 'second',
      },
      {
        key: [depA, depB, depC],
        value: 'third',
      },
    ];

    for (const attempt of attempts) {
      wem.set(attempt.key, attempt.value);
    }
    expect(wem.get(a, getEntity)[0]).toBe('third');
  });

  it('should set multiple on distinct paths', () => {
    const wem = new WeakDependencyMap<EntityPath>();
    const attempts = [
      {
        key: [depA, depB],
        value: 'first',
      },
      {
        key: [depB, depA],
        value: 'second',
      },
      {
        key: [depC, depA],
        value: 'third',
      },
      {
        key: [depA, depB, depC],
        value: 'fourth',
      },
      { key: [depC], value: 'fifth' },
    ];

    for (const attempt of attempts) {
      wem.set(attempt.key, attempt.value);
    }
    expect(wem.get(a, getEntity)[0]).toBe('fourth');
    expect(wem.get(b, getEntity)[0]).toBe('second');
    expect(wem.get(c, getEntity)[0]).toBe('fifth');

    expect(wem.get({}, getEntity)[0]).toBeUndefined();
  });

  it('considers empty key list invalid', () => {
    const wem = new WeakDependencyMap<EntityPath>();
    expect(() => wem.set([], 'whatever')).toThrowErrorMatchingInlineSnapshot(
      `"Keys must include at least one member"`,
    );

    expect(wem.get([], getEntity)[0]).toBeUndefined();
  });
});
