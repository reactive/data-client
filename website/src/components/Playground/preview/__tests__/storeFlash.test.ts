import { readFileSync } from 'fs';
import { join } from 'path';

import { CHANGE_KINDS } from '../store/actionGroups';
import { flash, kindColor } from '../store/dom';

describe('change colors', () => {
  it('has a color for every change kind', () => {
    const css = readFileSync(
      join(__dirname, '../store/store.module.css'),
      'utf8',
    );
    const missing = CHANGE_KINDS.filter(
      kind => !css.includes(`--store-kind-${kind}:`),
    );
    expect(missing).toEqual([]);
  });

  it('flashes each changed row in its change’s color', () => {
    const scope = document.createElement('div');
    scope.innerHTML = ['a', 'b', 'c', 'd']
      .map(id => `<div data-id="${id}"></div>`)
      .join('');
    const colors = new Map<string, unknown>();
    const animate = jest.fn(function (this: HTMLElement, frames: Keyframe[]) {
      colors.set(this.dataset.id!, frames[0].backgroundColor);
    });
    HTMLElement.prototype.animate = animate as any;
    try {
      const kinds = { a: 'added', b: 'updated', c: 'invalidated' } as const;
      flash(scope, id => kinds[id as keyof typeof kinds]);
      expect([...colors.keys()]).toEqual(['a', 'b', 'c']);
      for (const [id, kind] of Object.entries(kinds))
        expect(colors.get(id)).toContain(kindColor(kind));
    } finally {
      delete (HTMLElement.prototype as any).animate;
    }
  });
});
