/// <reference types="jest" />

describe('whenIdle', () => {
  let idle: (() => void)[];
  let whenIdle: typeof import('../whenIdle').whenIdle;
  let holdIdle: typeof import('../whenIdle').holdIdle;
  /** runs the next idle callback, as the browser would */
  const idlePeriod = () => idle.shift()?.();

  beforeEach(() => {
    idle = [];
    globalThis.requestIdleCallback = ((cb: () => void) => {
      idle.push(cb);
      return 0;
    }) as typeof requestIdleCallback;
    // the queue is module state
    jest.isolateModules(() => {
      ({ whenIdle, holdIdle } = require('../whenIdle'));
    });
  });

  test('runs one task per idle period, in order', () => {
    const ran: string[] = [];
    whenIdle(() => ran.push('a'));
    whenIdle(() => ran.push('b'));
    expect(ran).toEqual([]);
    idlePeriod();
    expect(ran).toEqual(['a']);
    idlePeriod();
    expect(ran).toEqual(['a', 'b']);
    expect(idle).toHaveLength(0);
  });

  test('a canceled task never runs', () => {
    const task = jest.fn();
    whenIdle(task)();
    idlePeriod();
    expect(task).not.toHaveBeenCalled();
  });

  test('waits while held, then runs once released', () => {
    const task = jest.fn();
    const release = holdIdle();
    whenIdle(task);
    idlePeriod();
    expect(task).not.toHaveBeenCalled();
    release();
    // a second release doesn't free another hold
    release();
    const other = holdIdle();
    idlePeriod();
    expect(task).not.toHaveBeenCalled();
    other();
    idlePeriod();
    expect(task).toHaveBeenCalledTimes(1);
  });

  test('a hold taken after asking still holds the task', () => {
    const task = jest.fn();
    whenIdle(task);
    const release = holdIdle();
    idlePeriod();
    expect(task).not.toHaveBeenCalled();
    release();
    idlePeriod();
    expect(task).toHaveBeenCalledTimes(1);
  });
});
