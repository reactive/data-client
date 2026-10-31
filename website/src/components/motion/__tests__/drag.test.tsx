/// <reference types="jest" />

import { act, render } from '@testing-library/react';
import React, { useState } from 'react';

import { Reorder, useDropGroup, useReorderItem } from '..';

// jsdom has no layout, Web Animations or PointerEvent: each box sits at its
// `data-y`, `data-h` tall, moved by its `translate`; animations are recorded
const animations: { el: Element; keyframes: Keyframe[] }[] = [];
beforeEach(() => {
  jest.useFakeTimers();
  animations.length = 0;
  jest
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockImplementation(function (this: HTMLElement) {
      const [x = 0, y = 0] = this.style.translate
        .split(' ')
        .map(n => parseFloat(n) || 0);
      const top = Number(this.dataset.y ?? 0) + y;
      const height = Number(this.dataset.h ?? 20);
      return { left: x, top, right: x + 100, bottom: top + height } as DOMRect;
    });
  HTMLElement.prototype.animate = function (keyframes: any) {
    animations.push({ el: this, keyframes });
    return {
      playState: 'running',
      currentTime: null,
      finished: new Promise(() => {}),
      cancel() {},
    } as unknown as Animation;
  };
});
afterEach(() => {
  // a drag's click guard comes off a tick after it ends
  act(() => void jest.runOnlyPendingTimers());
  jest.useRealTimers();
  jest.restoreAllMocks();
  delete (HTMLElement.prototype as any).animate;
});

function pointer(
  type: string,
  target: EventTarget,
  y: number,
  pointerType = 'mouse',
) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: 10,
    clientY: y,
  });
  Object.assign(event, { pointerId: 1, isPrimary: true, pointerType });
  act(() => void target.dispatchEvent(event));
}

// two people's groups, 100px apart; a todo row is 20px tall
type Todos = Record<string, string>;
function Board({ initial }: { initial: Todos }) {
  const [owners, setOwners] = useState(initial);
  const group = (owner: string, y: number) => {
    const ids = Object.keys(owners).filter(id => owners[id] === owner);
    return (
      <Group key={owner} owner={owner} y={y}>
        {ids.map((id, i) => (
          <Row
            key={id}
            id={id}
            y={y + 20 + i * 20}
            onDrop={to => setOwners({ ...owners, [id]: to })}
          />
        ))}
      </Group>
    );
  };
  return (
    <Reorder layoutDependency={owners}>
      {group('ann', 0)}
      {group('bo', 100)}
    </Reorder>
  );
}
function Group({
  owner,
  y,
  children,
}: {
  owner: string;
  y: number;
  children: React.ReactNode;
}) {
  return (
    <section
      data-testid={owner}
      data-y={y}
      data-h={80}
      ref={useDropGroup(owner)}
    >
      {children}
    </section>
  );
}
function Row({
  id,
  y,
  onDrop,
}: {
  id: string;
  y: number;
  onDrop: (owner: string) => void;
}) {
  return (
    <p data-testid={id} data-y={y} ref={useReorderItem(id, { onDrop })}>
      <input type="checkbox" data-testid={`${id} box`} />
    </p>
  );
}
const startOf = (el: Element) =>
  animations.find(animation => animation.el === el)?.keyframes[0];

it('drops a row into the group under it, gliding on from where it was let go', () => {
  const { getByTestId } = render(<Board initial={{ x: 'ann' }} />);
  const x = getByTestId('x');
  pointer('pointerdown', x, 25);
  pointer('pointermove', window, 60);
  // lifted and following, its own group not a target
  expect(x.dataset.dragging).toBe('');
  expect(x.style.translate).toBe('0px 35px');
  expect(getByTestId('ann').dataset.dropTarget).toBeUndefined();
  expect(getByTestId('bo').dataset.dropTarget).toBe('');
  pointer('pointermove', window, 140);
  expect(getByTestId('bo').dataset.dropOver).toBe('');
  pointer('pointerup', window, 140);
  // remounted at the top of bo's rows (y 120), from the drop at y 135
  const moved = getByTestId('x');
  expect(getByTestId('bo').contains(moved)).toBe(true);
  expect(startOf(moved)?.translate).toBe('0px 15px');
  expect(getByTestId('bo').dataset.dropTarget).toBeUndefined();
  expect(getByTestId('bo').dataset.dropOver).toBeUndefined();
});

it('sends a row let go outside any other group home', () => {
  const { getByTestId } = render(<Board initial={{ x: 'ann' }} />);
  const x = getByTestId('x');
  pointer('pointerdown', x, 25);
  pointer('pointermove', window, 45);
  pointer('pointerup', window, 45);
  expect(getByTestId('ann').contains(x)).toBe(true);
  expect(x.style.translate).toBe('');
  expect(startOf(x)?.translate).toBe('0px 20px');
});

it('treats a press that barely moves as a click on what was pressed', () => {
  const { getByTestId } = render(<Board initial={{ x: 'ann' }} />);
  const x = getByTestId('x');
  const clicked = jest.fn();
  x.addEventListener('click', clicked);
  pointer('pointerdown', x, 25);
  pointer('pointermove', window, 27);
  pointer('pointerup', window, 27);
  x.click();
  expect(x.dataset.dragging).toBeUndefined();
  expect(clicked).toHaveBeenCalled();
});

it('swallows the click a drag ends in', () => {
  const { getByTestId } = render(<Board initial={{ x: 'ann' }} />);
  const x = getByTestId('x');
  const clicked = jest.fn();
  x.addEventListener('click', clicked);
  pointer('pointerdown', x, 25);
  pointer('pointermove', window, 45);
  pointer('pointerup', window, 45);
  x.click();
  expect(clicked).not.toHaveBeenCalled();
});

it("leaves presses on the row's controls to them", () => {
  const { getByTestId } = render(<Board initial={{ x: 'ann' }} />);
  pointer('pointerdown', getByTestId('x box'), 25);
  pointer('pointermove', window, 60);
  expect(getByTestId('x').dataset.dragging).toBeUndefined();
});

it('lifts under a finger only after it holds still, so a swipe scrolls', () => {
  const { getByTestId } = render(<Board initial={{ x: 'ann' }} />);
  const x = getByTestId('x');
  pointer('pointerdown', x, 25, 'touch');
  pointer('pointermove', window, 60, 'touch');
  act(() => void jest.advanceTimersByTime(1000));
  expect(x.dataset.dragging).toBeUndefined();
  pointer('pointerup', window, 60, 'touch');

  pointer('pointerdown', x, 25, 'touch');
  act(() => void jest.advanceTimersByTime(300));
  expect(x.dataset.dragging).toBe('');
});

it('puts a carried row back on Escape', () => {
  const { getByTestId } = render(<Board initial={{ x: 'ann' }} />);
  const x = getByTestId('x');
  pointer('pointerdown', x, 25);
  pointer('pointermove', window, 140);
  act(
    () =>
      void window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape' }),
      ),
  );
  expect(getByTestId('bo').dataset.dropOver).toBeUndefined();
  expect(x.style.translate).toBe('');
  pointer('pointerup', window, 140);
  expect(getByTestId('ann').contains(x)).toBe(true);
});

// a list whose drops do nothing (or `onDrop` says): bo is empty
function Fixed({
  onDrop = () => {},
  bo = true,
}: {
  onDrop?: (owner: string) => unknown;
  bo?: boolean;
}) {
  return (
    <Reorder layoutDependency={0}>
      <Group owner="ann" y={0}>
        <Row id="x" y={20} onDrop={onDrop} />
      </Group>
      {bo && (
        <Group owner="bo" y={100}>
          {null}
        </Group>
      )}
    </Reorder>
  );
}
const carryToBo = (x: HTMLElement) => {
  pointer('pointerdown', x, 25);
  pointer('pointermove', window, 140);
};
const settle = () =>
  act(async () => {
    await Promise.resolve();
    jest.runOnlyPendingTimers();
  });

it('holds a drop until what it set off settles, then sends it home if the list never followed', async () => {
  let resolve!: () => void;
  const { getByTestId } = render(
    <Fixed onDrop={() => new Promise<void>(r => (resolve = r))} />,
  );
  const x = getByTestId('x');
  carryToBo(x);
  pointer('pointerup', window, 140);
  await settle();
  // the fetch is still out: held where it was let go
  expect(x.style.translate).toBe('0px 115px');
  resolve();
  await settle();
  expect(x.style.translate).toBe('');
  expect(startOf(x)?.translate).toBe('0px 115px');
});

it('keeps a drop held while an earlier drop of it settles', async () => {
  const fetches: (() => void)[] = [];
  const { getByTestId } = render(
    <Fixed onDrop={() => new Promise<void>(r => fetches.push(r))} />,
  );
  const x = getByTestId('x');
  carryToBo(x);
  pointer('pointerup', window, 140);
  carryToBo(x);
  pointer('pointerup', window, 140);
  fetches[0]();
  await settle();
  expect(x.style.translate).not.toBe('');
  fetches[1]();
  await settle();
  expect(x.style.translate).toBe('');
});

it('puts back a row whose target group went away while carried', () => {
  const onDrop = jest.fn();
  const { getByTestId, rerender } = render(<Fixed onDrop={onDrop} />);
  const x = getByTestId('x');
  carryToBo(x);
  rerender(<Fixed onDrop={onDrop} bo={false} />);
  pointer('pointerup', window, 140);
  expect(onDrop).not.toHaveBeenCalled();
  expect(x.style.translate).toBe('');
});

it('lets go of a press whose row unmounts', () => {
  const { getByTestId, rerender } = render(<Board initial={{ x: 'ann' }} />);
  carryToBo(getByTestId('x'));
  rerender(<Board initial={{}} key="empty" />);
  expect(getByTestId('bo').dataset.dropTarget).toBeUndefined();
  // a new press works
  rerender(<Board initial={{ y: 'ann' }} key="again" />);
  const y = getByTestId('y');
  pointer('pointerdown', y, 25);
  pointer('pointermove', window, 60);
  expect(y.dataset.dragging).toBe('');
});

it('recovers from an onDrop that throws', () => {
  const { getByTestId } = render(
    <Fixed
      onDrop={() => {
        throw new Error('nope');
      }}
    />,
  );
  const x = getByTestId('x');
  carryToBo(x);
  // the browser reports it; the drag still ends
  const reported = jest.fn((e: Event) => e.preventDefault());
  window.addEventListener('error', reported, { once: true });
  pointer('pointerup', window, 140);
  expect(reported).toHaveBeenCalled();
  carryToBo(x);
  expect(x.dataset.dragging).toBe('');
});

it('treats a still finger let go after the hold as a tap', () => {
  const { getByTestId } = render(<Board initial={{ x: 'ann' }} />);
  const x = getByTestId('x');
  const clicked = jest.fn();
  x.addEventListener('click', clicked);
  pointer('pointerdown', x, 25, 'touch');
  act(() => void jest.advanceTimersByTime(300));
  pointer('pointerup', window, 26, 'touch');
  x.click();
  expect(clicked).toHaveBeenCalled();
  expect(x.style.translate).toBe('');
});

it("keeps a group's value apart from the items' keys", () => {
  // the group stands for 'x', and the row's key is 'x' too
  function Group({ y }: { y: number }) {
    return (
      <section
        data-testid="group"
        data-y={y}
        data-h={80}
        ref={useDropGroup('x')}
      />
    );
  }
  function Row() {
    return <p data-testid="row" data-y={200} ref={useReorderItem('x')} />;
  }
  const shared = (y: number) => (
    <Reorder layoutDependency={y}>
      <Group y={y} />
      <Row />
    </Reorder>
  );
  const { getByTestId, rerender } = render(shared(100));
  rerender(shared(0));
  // the group glides up from where it was; the row stayed put
  expect(startOf(getByTestId('group'))?.translate).toBe('0px 100px');
  expect(startOf(getByTestId('row'))).toBeUndefined();
});
