/// <reference types="jest" />

import {
  createPlayer,
  FIND_TIMEOUT,
  KEY_MS,
  MOVE_MS,
  type Stage,
} from '../autorun/player';
import type { AutoRunScript } from '../autorun/script';
import { createStage } from '../autorun/stage';

function fakeStage(
  found: HTMLElement | null = document.createElement('input'),
) {
  const calls: string[] = [];
  const stage: Stage = {
    find: () => found,
    point: () => void calls.push('point'),
    click: () => void calls.push('click'),
    append: (_, text) => void calls.push(`append ${text}`),
    caption: text => void calls.push(`caption ${text}`),
    store: open => void calls.push(`store ${open}`),
    end: () => void calls.push('end'),
  };
  return { stage, calls };
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

const script: AutoRunScript = [
  { caption: 'hi', delay: 100, type: 'input', text: 'ab' },
  { delay: 100, store: 'open' },
  { delay: 100, click: 'button' },
];

it('plays steps in order, at their times', async () => {
  const player = createPlayer();
  const { stage, calls } = fakeStage();
  const done = player.play(script, stage);
  expect(player.getState()).toBe('playing');
  expect(calls).toEqual(['caption hi']);
  await jest.advanceTimersByTimeAsync(100 + MOVE_MS);
  expect(calls).toEqual(['caption hi', 'point', 'append a']);
  await jest.advanceTimersByTimeAsync(KEY_MS);
  expect(calls.at(-1)).toBe('append b');
  await jest.runAllTimersAsync();
  await done;
  expect(calls.slice(4)).toEqual(['store true', 'point', 'click', 'end']);
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
  expect(calls).toEqual(['caption hi', 'point', 'append a', 'end']);
  expect(listener).toHaveBeenCalledTimes(2);
});

it('stopping before a run keeps it from starting by itself', () => {
  const player = createPlayer();
  player.stop();
  expect(player.getState()).toBe('done');
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
    const seen: string[] = [];
    for (const type of ['pointerdown', 'mousedown', 'mouseup', 'click'])
      button.addEventListener(type, () => seen.push(type));
    stage.click(button);
    expect(seen).toEqual(['pointerdown', 'mousedown', 'mouseup', 'click']);
  });

  it('end() takes its layer away', () => {
    const root = playground();
    const stage = createStage(root, () => {});
    stage.caption('hello');
    expect(root.querySelector('[aria-live]')?.textContent).toBe('hello');
    stage.end();
    jest.runAllTimers();
    expect(root.querySelector('[aria-live]')).toBeNull();
  });
});
