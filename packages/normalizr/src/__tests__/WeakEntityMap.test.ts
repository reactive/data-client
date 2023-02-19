import WeakEntityMap from '../WeakEntityMap';

describe('WeakEntityMap', () => {
  const a = { hi: '5' };
  const b = [1, 2, 3];
  const c = new Date(0);
  const state = {
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
  const depA = { path: { key: 'A', pk: '1' }, entity: a };
  const depB = { path: { key: 'B', pk: '2' }, entity: b };
  const depC = { path: { key: 'C', pk: '3' }, entity: c };

  it('should construct', () => {
    const wem = new WeakEntityMap();
  });

  it('should set one item', () => {
    const wem = WeakEntityMap.fromState(new WeakEntityMap(), state);
    const deps = [depA];
    wem.set(deps, 'myvalue');

    expect(wem.get(a)).toBe('myvalue');

    expect(wem.get(b)).toBeUndefined();
    expect(wem.get(c)).toBeUndefined();
  });

  it('should set multiple on same path', () => {
    const wem = WeakEntityMap.fromState(new WeakEntityMap(), state);
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
    expect(wem.get(a)).toBe('third');
  });

  it('should set multiple on distinct paths', () => {
    const wem = WeakEntityMap.fromState(new WeakEntityMap(), state);
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
    expect(wem.get(a)).toBe('fourth');
    expect(wem.get(b)).toBe('second');
    expect(wem.get(c)).toBe('fifth');

    expect(wem.get({})).toBeUndefined();
  });

  it('considers empty key list invalid', () => {
    const wem = WeakEntityMap.fromState(new WeakEntityMap(), state);
    expect(() => wem.set([], 'whatever')).toThrowErrorMatchingInlineSnapshot(
      `"Keys must include at least one member"`,
    );

    expect(wem.get([])).toBeUndefined();
  });
});
