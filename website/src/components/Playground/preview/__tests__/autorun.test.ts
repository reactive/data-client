/// <reference types="jest" />

import { act, renderHook } from '@testing-library/react';

import {
  createPlayer,
  FIND_TIMEOUT,
  KEY_MS,
  MOVE_MS,
  type Stage,
} from '../autorun/player';
import type { AutoRunScript } from '../autorun/script';
import { createStage } from '../autorun/stage';
import { isReaderInput, useAutoRun } from '../autorun/useAutoRun';

function fakeStage(
  found: HTMLElement | null = document.createElement('input'),
) {
  const calls: string[] = [];
  const stage: Stage = {
    find: () => found,
    point: () => void calls.push('point'),
    click: () => void calls.push('click'),
    append: (_, text) => void calls.push(`append ${text}`),
    store: open => void calls.push(`store ${open}`),
    end: () => void calls.push('end'),
  };
  return { stage, calls };
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

const script: AutoRunScript = [
  { delay: 100, type: 'input', text: 'ab' },
  { delay: 100, store: 'open' },
  { delay: 100, click: 'button' },
];

it('plays steps in order, at their times', async () => {
  const player = createPlayer();
  const { stage, calls } = fakeStage();
  const done = player.play(script, stage);
  expect(player.getState()).toBe('playing');
  expect(calls).toEqual([]);
  await jest.advanceTimersByTimeAsync(100 + MOVE_MS);
  expect(calls).toEqual(['point', 'append a']);
  await jest.advanceTimersByTimeAsync(KEY_MS);
  expect(calls.at(-1)).toBe('append b');
  await jest.runAllTimersAsync();
  await done;
  expect(calls.slice(3)).toEqual(['store true', 'point', 'click', 'end']);
  expect(player.getState()).toBe('done');
});

it('pausing keeps the time left', async () => {
  const player = createPlayer();
  const { stage, calls } = fakeStage();
  player.play([{ delay: 1000, store: 'open' }], stage);
  await jest.advanceTimersByTimeAsync(600);
  player.setPaused(true);
  await jest.advanceTimersByTimeAsync(5000);
  expect(calls).toEqual([]);
  player.setPaused(false);
  await jest.advanceTimersByTimeAsync(399);
  expect(calls).toEqual([]);
  await jest.advanceTimersByTimeAsync(1);
  expect(calls).toEqual(['store true', 'end']);
});

it('stop ends the run where it is', async () => {
  const player = createPlayer();
  const { stage, calls } = fakeStage();
  const listener = jest.fn();
  player.subscribe(listener);
  const done = player.play(script, stage);
  await jest.advanceTimersByTimeAsync(100 + MOVE_MS);
  player.stop();
  expect(player.getState()).toBe('done');
  await done;
  await jest.runAllTimersAsync();
  expect(calls).toEqual(['point', 'append a', 'end']);
  expect(listener).toHaveBeenCalledTimes(2);
});

it('a wait holds for its own time only', async () => {
  const player = createPlayer();
  const { stage, calls } = fakeStage();
  player.play([{ wait: 500 }, { delay: 100, store: 'open' }], stage);
  await jest.advanceTimersByTimeAsync(599);
  expect(calls).toEqual([]);
  await jest.advanceTimersByTimeAsync(1);
  expect(calls).toEqual(['store true', 'end']);
});

it('stopping an idle player leaves it idle', () => {
  const player = createPlayer();
  player.stop();
  expect(player.getState()).toBe('idle');
});

it('gives up on a target that never shows', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const player = createPlayer();
  const { stage, calls } = fakeStage(null);
  const done = player.play([{ click: 'nope' }], stage);
  await jest.advanceTimersByTimeAsync(FIND_TIMEOUT + 1000);
  await done;
  expect(calls).toEqual(['end']);
  expect(player.getState()).toBe('done');
  expect(warn).toHaveBeenCalled();
  warn.mockRestore();
});

describe('stage', () => {
  function playground() {
    const root = document.createElement('div');
    root.innerHTML = `
      <div class="playground-preview">
        <span><input value="Ann" /><label>Name</label></span>
        <button>One</button><button>Two</button>
      </div>
      <div data-store-panel><button>Two</button></div>`;
    document.body.append(root);
    return root;
  }
  afterEach(() => (document.body.innerHTML = ''));

  it('finds by selector, text, label and scope', () => {
    const root = playground();
    const stage = createStage(root, () => {});
    const [, previewTwo, storeTwo] = root.querySelectorAll('button');
    expect(stage.find({ selector: 'button', hasText: 'Two' })).toBe(previewTwo);
    expect(stage.find({ in: 'store', selector: 'button' })).toBe(storeTwo);
    expect(stage.find({ label: 'Name' })).toBe(root.querySelector('input'));
    expect(stage.find('select')).toBeNull();
  });

  it('types and clicks through React-visible, untrusted events', () => {
    const root = playground();
    const stage = createStage(root, () => {});
    const input = root.querySelector('input')!;
    const onInput = jest.fn((e: Event) => e.isTrusted);
    input.addEventListener('input', onInput);
    stage.append(input, '!');
    expect(input.value).toBe('Ann!');
    expect(onInput).toHaveReturnedWith(false);

    const button = root.querySelector('button')!;
    stage.point(button);
    const seen: string[] = [];
    for (const type of ['pointerdown', 'mousedown', 'mouseup', 'click'])
      button.addEventListener(type, () => seen.push(type));
    stage.click(button);
    expect(seen).toEqual(['pointerdown', 'mousedown', 'mouseup', 'click']);
  });

  it('the pointer follows its target when the playground resizes', () => {
    let resized: () => void = () => {};
    (globalThis as any).ResizeObserver = class {
      constructor(callback: () => void) {
        resized = callback;
      }

      observe() {}
      disconnect() {}
    };
    // jsdom lacks scrolling, which bringing the target into view uses
    Element.prototype.scrollTo = () => {};
    try {
      const root = playground();
      const stage = createStage(root, () => {});
      const button = root.querySelector('button')!;
      let top = 100;
      button.getBoundingClientRect = () =>
        ({ left: 0, top, width: 20, height: 20 }) as DOMRect;
      stage.point(button);
      const pointer = root.querySelector<HTMLElement>('svg')!.parentElement!;
      expect(pointer.style.transform).toBe('translate(10px, 110px)');
      top = 400;
      resized();
      expect(pointer.style.transform).toBe('translate(10px, 410px)');
    } finally {
      delete (globalThis as any).ResizeObserver;
      delete (Element.prototype as any).scrollTo;
    }
  });

  it('end() takes its layer away', () => {
    const root = playground();
    const before = [...root.children];
    const stage = createStage(root, () => {});
    const [layer] = [...root.children].filter(el => !before.includes(el));
    stage.point(root.querySelector('button')!);
    expect(layer).toBeDefined();
    stage.end();
    jest.runAllTimers();
    expect(layer.isConnected).toBe(false);
  });
});

describe('isReaderInput', () => {
  const control = document.createElement('button');
  control.dataset.autorunControl = '';
  const other = document.createElement('button');
  it.each([
    [
      'a press',
      {
        isTrusted: true,
        type: 'pointerdown',
        pointerType: 'mouse',
        target: other,
      },
      true,
    ],
    [
      'a tap (its click)',
      { isTrusted: true, type: 'click', pointerType: 'touch', target: other },
      true,
    ],
    ['a key', { isTrusted: true, type: 'keydown', target: other }, true],
    [
      'a touch, which may scroll',
      {
        isTrusted: true,
        type: 'pointerdown',
        pointerType: 'touch',
        target: other,
      },
      false,
    ],
    [
      "the demo's own event",
      { isTrusted: false, type: 'click', target: other },
      false,
    ],
    [
      "the demo's controls",
      { isTrusted: true, type: 'click', target: control },
      false,
    ],
  ])('%s: %s', (_, event, takesOver) => {
    expect(isReaderInput(event as unknown as Event)).toBe(takesOver);
  });
});

describe('useAutoRun', () => {
  let observed: IntersectionObserverCallback;
  beforeEach(() => {
    (globalThis as any).IntersectionObserver = class {
      constructor(callback: IntersectionObserverCallback) {
        observed = callback;
      }

      observe() {}
      disconnect() {}
    };
  });
  afterEach(() => {
    delete (globalThis as any).IntersectionObserver;
    document.body.innerHTML = '';
  });

  function mount(script: AutoRunScript = [{ store: 'open' }]) {
    const playground = document.createElement('div');
    playground.dataset.playground = '';
    const preview = document.createElement('div');
    playground.append(preview);
    document.body.append(playground);
    const showStore = jest.fn();
    const hook = renderHook(
      ({ script }) => useAutoRun(script, () => {}, showStore),
      { initialProps: { script } },
    );
    const unwatch = hook.result.current.watch(preview) as () => void;
    const see = (ratio: number, height = ratio * 100) =>
      observed(
        [
          {
            isIntersecting: ratio > 0,
            intersectionRatio: ratio,
            intersectionRect: { height } as DOMRect,
            rootBounds: { height: 800 } as DOMRect,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    return { ...hook, see, showStore, unwatch };
  }

  it('starts once mostly in view, not on a sliver', async () => {
    const { result, see, showStore } = mount();
    see(0.3);
    expect(result.current.player.getState()).toBe('idle');
    see(0.6);
    expect(result.current.player.getState()).toBe('playing');
    await jest.runAllTimersAsync();
    expect(showStore).toHaveBeenCalledWith(true);
  });

  it('starts a preview taller than the viewport once it fills most of it', () => {
    const { result, see } = mount();
    // 2000px tall in an 800px viewport
    see(0.2, 400);
    expect(result.current.player.getState()).toBe('idle');
    see(0.25, 500);
    expect(result.current.player.getState()).toBe('playing');
  });

  it('pauses only out of sight', async () => {
    const { see, showStore } = mount();
    see(1);
    see(0);
    await jest.advanceTimersByTimeAsync(5000);
    expect(showStore).not.toHaveBeenCalled();
    see(0.1);
    await jest.runAllTimersAsync();
    expect(showStore).toHaveBeenCalledWith(true);
  });

  it('an unmount leaves an idle player free to start', () => {
    const { result, unmount, unwatch } = mount();
    const { player } = result.current;
    unwatch();
    unmount();
    expect(player.getState()).toBe('idle');
  });

  it('starts a script by itself once, however often its preview mounts', () => {
    const script: AutoRunScript = [{ store: 'open' }];
    const first = mount(script);
    first.see(1);
    expect(first.result.current.player.getState()).toBe('playing');
    first.unwatch();
    first.unmount();
    // e.g. the Demo's other protocol tab, which shares the script
    const second = mount(script);
    second.see(1);
    expect(second.result.current.player.getState()).toBe('idle');
  });

  it("doesn't start by itself once the reader replayed it", () => {
    const script: AutoRunScript = [{ store: 'open' }];
    const first = mount(script);
    act(() => first.result.current.replay());
    first.unwatch();
    first.unmount();
    const second = mount(script);
    second.see(1);
    expect(second.result.current.player.getState()).toBe('idle');
  });

  it('replay starts over from a fresh store, closing a Store it opens', () => {
    const reset = jest.fn();
    const playground = document.createElement('div');
    playground.dataset.playground = '';
    const preview = document.createElement('div');
    playground.append(preview);
    document.body.append(playground);
    const showStore = jest.fn();
    const { result } = renderHook(() =>
      useAutoRun([{ store: 'open' }], reset, showStore),
    );
    result.current.watch(preview);
    act(() => result.current.replay());
    expect(reset).toHaveBeenCalledTimes(1);
    expect(showStore).toHaveBeenCalledWith(false);
    expect(result.current.player.getState()).toBe('playing');
  });

  it("a script that changes identity doesn't start over a run", () => {
    const { result, see, rerender } = mount([{ store: 'open' }]);
    const play = jest.spyOn(result.current.player, 'play');
    see(1);
    rerender({ script: [{ store: 'open' }] });
    see(0.9);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('an unmount ends a run', () => {
    const { result, see, unmount, unwatch } = mount();
    see(1);
    const { player } = result.current;
    unwatch();
    unmount();
    expect(player.getState()).toBe('done');
  });
});
