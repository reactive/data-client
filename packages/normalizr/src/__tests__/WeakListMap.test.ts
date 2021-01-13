import WeakListMap from '../WeakListMap';
describe('WeakListMap', () => {
  const a = { hi: '5' };
  const b = [1, 2, 3];
  const c = new Date(0);

  it('should construct', () => {
    const wlm = new WeakListMap();
  });

  it('should set one item', () => {
    const wlm = new WeakListMap();
    wlm.set([a], 'myvalue');
    expect(wlm).toMatchInlineSnapshot(`
        WeakListMap {
          "first": WeakMap {},
        }
      `);

    expect(wlm.get([a])).toBe('myvalue');

    expect(wlm.has([a])).toBe(true);
    expect(wlm.has([a, b])).toBe(false);
    expect(wlm.has([c, b])).toBe(false);
    expect(wlm.has([b])).toBe(false);
    wlm.delete([a]);
    expect(wlm.has([a])).toBe(false);
  });

  it('should set multiple on same path', () => {
    const wlm = new WeakListMap();
    const attempts = [
      { key: [a], value: 'first' },
      { key: [a, b], value: 'second' },
      { key: [a, b, c], value: 'third' },
    ];

    for (const attempt of attempts) {
      wlm.set(attempt.key, attempt.value);
    }
    for (const attempt of attempts) {
      expect(wlm.get(attempt.key)).toBe(attempt.value);
    }

    expect(wlm.delete(attempts[0].key)).toBe(true);

    expect(wlm.get(attempts[0].key)).toBeUndefined();
    expect(wlm.has(attempts[0].key)).toBe(false);
    for (const attempt of attempts.slice(1)) {
      expect(wlm.get(attempt.key)).toBe(attempt.value);
    }
  });

  it('should set multiple on distinct paths', () => {
    const wlm = new WeakListMap();
    const attempts = [
      { key: [a, b], value: 'first' },
      { key: [b, a], value: 'second' },
      { key: [c, a], value: 'third' },
      { key: [a, b, c], value: 'fourth' },
      { key: [c], value: 'fifth' },
    ];

    for (const attempt of attempts) {
      wlm.set(attempt.key, attempt.value);
    }
    for (const attempt of attempts) {
      expect(wlm.get(attempt.key)).toBe(attempt.value);
      expect(wlm.has(attempt.key)).toBe(true);
    }

    expect(wlm.get([a])).toBeUndefined();
    expect(wlm.has([a])).toBe(false);
  });

  it('considers empty key list invalid', () => {
    const wlm = new WeakListMap();
    expect(() => wlm.set([], 'whatever')).toThrowErrorMatchingInlineSnapshot(
      `"Keys must include at least one member"`,
    );

    expect(wlm.delete([])).toBe(false);

    expect(wlm.get([])).toBeUndefined();

    expect(wlm.has([])).toBe(false);
  });
});
