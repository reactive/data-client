import type { AutoRunScript, Step, Target } from './script';
import { springEasing, springs } from '../../../motion';
import type { StoreView } from '../store/storeView';

/** What a script acts on: the playground's DOM (./stage.ts) */
export interface Stage {
  find(target: Target): HTMLElement | null;
  /** Brings `el` into view and moves the pointer onto it; false when it
   * was there already (a repeated click), so there's no glide to wait out */
  point(el: HTMLElement): boolean;
  click(el: HTMLElement): void;
  append(el: HTMLElement, text: string): void;
  /** Chooses `value` in a `select` */
  pick(el: HTMLElement, value: string): void;
  /** Opens or closes the Store, in `view` if given; `pressed`: the pointer
   * is on the Store's toggle, so the stage shows a press there */
  store(open: boolean, options?: { pressed?: boolean; view?: StoreView }): void;
  /** The run is over: the pointer goes */
  end(): void;
}

export type PlayerState = 'idle' | 'playing' | 'done';

/** ms: before each step, unless it says; the pointer's glide
 * (`--motion-smooth`); between typed characters; how long a target may take
 * to appear and how often to look */
export const STEP_DELAY = 700;
export const MOVE_MS = springEasing(springs.smooth).duration;
export const KEY_MS = 90;
export const FIND_TIMEOUT = 5000;
const FIND_EVERY = 50;
/** The Store's toggle: the code's corner badge, or a narrow layout's header
 * button */
export const STORE_TOGGLE: Target = {
  in: 'playground',
  selector: '[data-store-toggle]',
};

/** Plays scripts one at a time on a clock that pauses (out of view) without
 * losing its place. `stop()` ends a run for good: a reader who takes over
 * changes what the rest of the script assumes. */
export function createPlayer() {
  let state: PlayerState = 'idle';
  let run: AbortController | null = null;
  const clock = createClock();
  const listeners = new Set<() => void>();
  const set = (next: PlayerState) => {
    state = next;
    listeners.forEach(listener => listener());
  };

  function stop() {
    if (!run) return;
    run.abort();
    run = null;
    set('done');
  }

  async function play(script: AutoRunScript, stage: Stage) {
    run?.abort();
    const current = (run = new AbortController());
    set('playing');
    const sleep = (ms: number) => clock.sleep(ms, current.signal);
    try {
      for (const step of script) await perform(step, stage, sleep);
    } catch (error) {
      if (!current.signal.aborted) console.warn('Playground demo:', error);
    } finally {
      stage.end();
      if (run === current) {
        run = null;
        set('done');
      }
    }
  }

  return {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    play,
    stop,
    setPaused: clock.setPaused,
  };
}
export type Player = ReturnType<typeof createPlayer>;

async function perform(
  step: Step,
  stage: Stage,
  sleep: (ms: number) => Promise<void>,
) {
  if ('wait' in step) return sleep(step.wait);
  await sleep(step.delay ?? STEP_DELAY);
  if ('store' in step) {
    // onto the Store's toggle first, as a reader would; where the layout
    // shows one
    const toggle = stage.find(STORE_TOGGLE);
    if (toggle && stage.point(toggle)) await sleep(MOVE_MS);
    return stage.store(step.store === 'open', {
      pressed: !!toggle,
      view: step.view,
    });
  }

  // look the target up again before each act: a render may have replaced it
  const find = async (target: Target) => {
    for (let waited = 0; waited < FIND_TIMEOUT; waited += FIND_EVERY) {
      const el = stage.find(target);
      if (el) return el;
      await sleep(FIND_EVERY);
    }
    throw new Error(`nothing matches ${JSON.stringify(target)}`);
  };
  const target =
    'click' in step ? step.click
    : 'select' in step ? step.select
    : step.type;
  if (stage.point(await find(target))) await sleep(MOVE_MS);
  if ('click' in step) return stage.click(await find(target));
  if ('select' in step) return stage.pick(await find(target), step.value);
  for (const char of step.text) {
    stage.append(await find(target), char);
    await sleep(KEY_MS);
  }
}

/** One sleep at a time (a run is sequential); pausing keeps what's left */
function createClock() {
  let paused = false;
  let current: { pause(): void; resume(): void } | null = null;
  return {
    setPaused(next: boolean) {
      if (next === paused) return;
      paused = next;
      if (paused) current?.pause();
      else current?.resume();
    },
    sleep(ms: number, signal: AbortSignal) {
      return new Promise<void>((resolve, reject) => {
        if (signal.aborted) return reject(signal.reason);
        let left = ms;
        let since = 0;
        let timer: ReturnType<typeof setTimeout>;
        const settle = () => {
          current = null;
          signal.removeEventListener('abort', abort);
        };
        const abort = () => {
          clearTimeout(timer);
          settle();
          reject(signal.reason);
        };
        current = {
          pause() {
            clearTimeout(timer);
            left -= performance.now() - since;
          },
          resume() {
            since = performance.now();
            timer = setTimeout(() => {
              settle();
              resolve();
            }, left);
          },
        };
        signal.addEventListener('abort', abort, { once: true });
        if (!paused) current.resume();
      });
    },
  };
}
