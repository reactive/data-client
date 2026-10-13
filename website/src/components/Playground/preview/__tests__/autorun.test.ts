/// <reference types="jest" />

import { act, renderHook } from '@testing-library/react';

import {
  createPlayer,
  FIND_TIMEOUT,
  KEY_MS,
  MOVE_MS,
  STORE_TOGGLE,
  type Stage,
} from '../autorun/player';
import type { AutoRunScript } from '../autorun/script';
import { createStage } from '../autorun/stage';
import { isReaderInput, useAutoRun } from '../autorun/useAutoRun';

function fakeStage(
  found: HTMLElement | null = document.createElement('input'),
  /** The Store's toggle, if the layout shows one */
  toggle: HTMLElement | null = null,
) {
  const calls: string[] = [];
  const stage: Stage = {
    find: target => (target === STORE_TOGGLE ? toggle : found),
    point: el => void calls.push(el === toggle ? 'point toggle' : 'point'),
    click: () => void calls.push('click'),
    append: (_, text) => void calls.push(`append ${text}`),
    store: (open, pressed) =>
      void calls.push(`store ${open}${pressed ? ' pressed' : ''}`),
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

it('glides onto the Store toggle before opening the Store', async () => {
  const player = createPlayer();
  const { stage, calls } = fakeStage(null, document.createElement('button'));
  player.play([{ delay: 0, store: 'open' }], stage);
  await jest.advanceTimersByTimeAsync(0);
  expect(calls).toEqual(['point toggle']);
  await jest.advanceTimersByTimeAsync(MOVE_MS);
  expect(calls).toEqual(['point toggle', 'store true pressed', 'end']);
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

  it('opens the Store without its click, ringing only for a press', () => {
    Element.prototype.scrollTo = () => {};
    const animate = jest.fn();
    HTMLElement.prototype.animate = animate;
    try {
      const root = playground();
      const showStore = jest.fn();
      const stage = createStage(root, showStore);
      const toggle = root.querySelector('button')!;
      const onClick = jest.fn();
      toggle.addEventListener('click', onClick);
      stage.point(toggle);
      stage.store(true);
      expect(animate).not.toHaveBeenCalled();
      stage.store(false, true);
      expect(animate).toHaveBeenCalledTimes(1);
      expect(showStore.mock.calls).toEqual([[true], [false]]);
      expect(onClick).not.toHaveBeenCalled();
    } finally {
      delete (HTMLElement.prototype as any).animate;
    }
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
      // a render took it away: the pointer stays where it was
      button.remove();
      top = 0;
      resized();
      expect(pointer.style.transform).toBe('translate(10px, 410px)');
    } finally {
      delete (globalThis as any).ResizeObserver;
      delete (Element.prototype as any).scrollTo;
    }
  });

  it('scrolls the page to a target out of sight, clear of the navbar', () => {
    const root = playground();
    root.insertAdjacentHTML('afterbegin', '<nav class="navbar"></nav>');
    root.querySelector('.navbar')!.getBoundingClientRect = () =>
      ({ bottom: 60 }) as DOMRect;
    const stage = createStage(root, () => {});
    const button = root.querySelector('button')!;
    const scrolled = jest.fn();
    button.scrollIntoView = scrolled;
    Element.prototype.scrollTo = () => {};
    try {
      for (const top of [100, 30, 900]) {
        button.getBoundingClientRect = () =>
          ({
            left: 0,
            top,
            bottom: top + 20,
            width: 20,
            height: 20,
          }) as DOMRect;
        stage.point(button);
      }
    } finally {
      delete (Element.prototype as any).scrollTo;
    }
    // under the navbar (30) and below the viewport (900), not in view (100)
    expect(scrolled).toHaveBeenCalledTimes(2);
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
    // jsdom lacks it; replay calls it
    HTMLElement.prototype.scrollIntoView = jest.fn();
  });
  afterEach(() => {
    delete (HTMLElement.prototype as any).scrollIntoView;
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
    const entry = (target: Element, ratio: number, height = ratio * 100) =>
      ({
        target,
        isIntersecting: ratio > 0,
        intersectionRatio: ratio,
        intersectionRect: { height } as DOMRect,
        rootBounds: { height: 800 } as DOMRect,
      }) as IntersectionObserverEntry;
    /** The playground and its preview, `ratio` of each in view */
    const see = (ratio: number, height?: number) =>
      observed(
        [entry(playground, ratio, height), entry(preview, ratio, height)],
        {} as IntersectionObserver,
      );
    const seeOnly = (target: Element, ratio: number) =>
      observed([entry(target, ratio)], {} as IntersectionObserver);
    return { ...hook, see, seeOnly, playground, preview, showStore, unwatch };
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

  it('pauses once mostly out of sight, before it scrolls the page back', async () => {
    const { see, showStore } = mount();
    see(1);
    // the reader scrolling on past it
    see(0.2);
    await jest.advanceTimersByTimeAsync(5000);
    expect(showStore).not.toHaveBeenCalled();
    see(0.6);
    await jest.runAllTimersAsync();
    expect(showStore).toHaveBeenCalledWith(true);
  });

  it('plays on while the preview shows, the Store opened above it', async () => {
    // on a phone, before the demo scrolls up to the Store
    const { see, seeOnly, playground, showStore } = mount([
      { store: 'open' },
      { store: 'close' },
    ]);
    see(1);
    seeOnly(playground, 0.5);
    await jest.runAllTimersAsync();
    expect(showStore).toHaveBeenLastCalledWith(false);
  });

  it('plays on while the playground shows, the preview gone from view', async () => {
    // on a phone the Store opens above the preview, and the demo acts there
    const { see, seeOnly, preview, showStore } = mount();
    see(1);
    seeOnly(preview, 0);
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
    // e.g. the page's framework switched away and back
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

  it('acts on the latest of several queued observations', () => {
    const { result, preview } = mount();
    observed(
      [
        { target: preview, isIntersecting: false, intersectionRatio: 0 },
        {
          target: preview,
          isIntersecting: true,
          intersectionRatio: 1,
          intersectionRect: { height: 100 },
          rootBounds: { height: 800 },
        },
      ] as unknown as IntersectionObserverEntry[],
      {} as IntersectionObserver,
    );
    expect(result.current.player.getState()).toBe('playing');
  });

  it("doesn't start on an observation a later one replaced", () => {
    const { result, preview } = mount();
    observed(
      [
        {
          target: preview,
          isIntersecting: true,
          intersectionRatio: 1,
          intersectionRect: { height: 100 },
          rootBounds: { height: 800 },
        },
        { target: preview, isIntersecting: false, intersectionRatio: 0 },
      ] as unknown as IntersectionObserverEntry[],
      {} as IntersectionObserver,
    );
    expect(result.current.player.getState()).toBe('idle');
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

  it('replay brings the preview into view, which it plays in', async () => {
    const { result, see, preview, showStore } = mount();
    preview.scrollIntoView = jest.fn(() => see(1));
    see(0.1);
    act(() => result.current.replay());
    expect(preview.scrollIntoView).toHaveBeenCalled();
    await jest.runAllTimersAsync();
    expect(showStore).toHaveBeenLastCalledWith(true);
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
