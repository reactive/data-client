import { flash } from '../store/dom';

describe('flash', () => {
  it('highlights each changed row in its change’s color', () => {
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
      const kinds = { a: 'added', b: 'updated', c: 'removed' } as const;
      flash(scope, id => kinds[id as keyof typeof kinds]);
      expect(Object.fromEntries(colors)).toEqual({
        a: 'var(--store-flash-added)',
        b: 'var(--store-flash)',
        c: 'var(--store-flash-removed)',
      });
    } finally {
      delete (HTMLElement.prototype as any).animate;
    }
  });
});
