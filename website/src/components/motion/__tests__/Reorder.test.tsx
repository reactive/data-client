/// <reference types="jest" />

import { render } from '@testing-library/react';
import React from 'react';

import { Reorder, useReorderItem } from '..';

// jsdom has no layout or Web Animations: each box sits at its `data-y`, and
// the animations started are recorded
const animations: {
  el: Element;
  keyframes: Keyframe[];
  finish: () => void;
}[] = [];
beforeEach(() => {
  animations.length = 0;
  jest
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockImplementation(function (this: HTMLElement) {
      return { left: 0, top: Number(this.dataset.y ?? 0) } as DOMRect;
    });
  HTMLElement.prototype.animate = function (keyframes: any) {
    let finish!: () => void;
    const finished = new Promise<void>(resolve => (finish = resolve));
    animations.push({ el: this, keyframes, finish });
    return {
      playState: 'running',
      currentTime: null,
      finished,
      cancel() {},
    } as unknown as Animation;
  };
});
afterEach(() => {
  jest.restoreAllMocks();
  delete (window as any).matchMedia;
  delete (HTMLElement.prototype as any).animate;
});

type Group = { name: string; y: number; rows: { id: string; y: number }[] };

function Row({ id, y }: { id: string; y: number }) {
  return <p data-y={y} data-testid={id} ref={useReorderItem(id)} />;
}
function Section({ name, y, rows }: Group) {
  return (
    <section data-y={y} data-testid={name} ref={useReorderItem(name)}>
      {rows.map(row => (
        <Row key={row.id} {...row} />
      ))}
    </section>
  );
}
function Board({ groups }: { groups: Group[] }) {
  return (
    <Reorder layoutDependency={groups}>
      {groups.map(group => (
        <Section key={group.name} {...group} />
      ))}
    </Reorder>
  );
}
const startOf = (el: Element) =>
  animations.find(animation => animation.el === el)?.keyframes[0];

it('does not animate what is there on first render', () => {
  render(<Board groups={[{ name: 'a', y: 0, rows: [{ id: 'x', y: 10 }] }]} />);
  expect(animations).toHaveLength(0);
});

it('glides an item React remounts under another parent from where it was', () => {
  const { rerender, getByTestId } = render(
    <Board
      groups={[
        { name: 'a', y: 0, rows: [{ id: 'x', y: 10 }] },
        { name: 'b', y: 100, rows: [] },
      ]}
    />,
  );
  const before = getByTestId('x');
  rerender(
    <Board
      groups={[
        { name: 'a', y: 0, rows: [] },
        { name: 'b', y: 100, rows: [{ id: 'x', y: 110 }] },
      ]}
    />,
  );
  const after = getByTestId('x');
  expect(after).not.toBe(before);
  expect(startOf(after)?.translate).toBe('0px -100px');
  // groups that stayed put don't animate
  expect(startOf(getByTestId('a'))).toBeUndefined();
});

it('lets an item ride along with the item it is in, travelling only the rest', () => {
  const { rerender, getByTestId } = render(
    <Board
      groups={[
        { name: 'a', y: 0, rows: [] },
        { name: 'b', y: 100, rows: [{ id: 'x', y: 110 }] },
      ]}
    />,
  );
  // b moves up 50 to where a was; x inside it moves up 80
  rerender(
    <Board
      groups={[
        { name: 'b', y: 50, rows: [{ id: 'x', y: 30 }] },
        { name: 'a', y: 200, rows: [] },
      ]}
    />,
  );
  expect(startOf(getByTestId('b'))?.translate).toBe('0px 50px');
  expect(startOf(getByTestId('x'))?.translate).toBe('0px 30px');
});

it('marks the items crossing the others as traveling until they land', async () => {
  const { rerender, getByTestId } = render(
    <Board
      groups={[
        {
          name: 'a',
          y: 0,
          rows: [
            { id: 'x', y: 10 },
            { id: 'y', y: 40 },
          ],
        },
        { name: 'b', y: 100, rows: [{ id: 'z', y: 110 }] },
      ]}
    />,
  );
  // x moves to b; y and b's heading shift up a little
  rerender(
    <Board
      groups={[
        { name: 'a', y: 0, rows: [{ id: 'y', y: 10 }] },
        {
          name: 'b',
          y: 70,
          rows: [
            { id: 'z', y: 80 },
            { id: 'x', y: 110 },
          ],
        },
      ]}
    />,
  );
  const x = getByTestId('x');
  expect(x.dataset.traveling).toBe('');
  expect(getByTestId('y').dataset.traveling).toBeUndefined();
  expect(getByTestId('b').dataset.traveling).toBeUndefined();
  animations.find(animation => animation.el === x)?.finish();
  await Promise.resolve();
  expect(x.dataset.traveling).toBeUndefined();
});

it('keeps a newer mark when a glide it replaced settles', async () => {
  const at = (y: number) => [{ name: 'a', y: 0, rows: [{ id: 'x', y }] }];
  const { rerender, getByTestId } = render(<Board groups={at(10)} />);
  const x = getByTestId('x');
  rerender(<Board groups={at(110)} />);
  const first = animations.at(-1);
  // sent back mid-glide
  rerender(<Board groups={at(10)} />);
  expect(animations.at(-1)).not.toBe(first);
  expect(x.dataset.traveling).toBe('');
  first?.finish();
  await Promise.resolve();
  expect(x.dataset.traveling).toBe('');
});

it('does not mark a nudge too small to cross anything', () => {
  const { rerender, getByTestId } = render(
    <Board groups={[{ name: 'a', y: 0, rows: [{ id: 'x', y: 10 }] }]} />,
  );
  rerender(
    <Board groups={[{ name: 'a', y: 0, rows: [{ id: 'x', y: 10.5 }] }]} />,
  );
  expect(getByTestId('x').dataset.traveling).toBeUndefined();
});

it('fades in a key it has not seen', () => {
  const { rerender, getByTestId } = render(
    <Board groups={[{ name: 'a', y: 0, rows: [] }]} />,
  );
  rerender(
    <Board groups={[{ name: 'a', y: 0, rows: [{ id: 'x', y: 10 }] }]} />,
  );
  expect(startOf(getByTestId('x'))).toEqual({ opacity: 0 });
});

it('only animates when layoutDependency changes', () => {
  const groups = [{ name: 'a', y: 0, rows: [{ id: 'x', y: 10 }] }];
  const { rerender } = render(<Board groups={groups} />);
  groups[0].rows[0].y = 90;
  rerender(<Board groups={groups} />);
  expect(animations).toHaveLength(0);
});

it('lands in place under reduced motion', () => {
  window.matchMedia = jest.fn().mockReturnValue({ matches: true });
  const { rerender } = render(
    <Board groups={[{ name: 'a', y: 0, rows: [{ id: 'x', y: 10 }] }]} />,
  );
  rerender(
    <Board groups={[{ name: 'a', y: 0, rows: [{ id: 'x', y: 90 }] }]} />,
  );
  expect(animations).toHaveLength(0);
});
