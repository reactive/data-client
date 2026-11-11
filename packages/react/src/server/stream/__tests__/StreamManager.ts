jest.mock('react', () => {
  const actual = jest.requireActual('react');
  const startTransition = jest.fn((fn: () => void) =>
    actual.startTransition(fn),
  );
  const wrapped = { ...actual, startTransition };
  return { ...wrapped, default: wrapped };
});

import { startTransition } from 'react';

import { PIECE } from '../applyPiece';
import { getLedger } from '../Ledger';
import StreamManager from '../StreamManager';
import { STREAM_GLOBAL } from '../wire';
import type { StreamMessage } from '../wire';

const piece = (rev: number): StreamMessage => ({
  t: 'piece',
  rev,
  entities: { Todo: { [rev]: { id: String(rev) } } },
});
const push = (...messages: StreamMessage[]) =>
  (globalThis as any)[STREAM_GLOBAL].push(...messages);

describe('StreamManager', () => {
  beforeEach(() => {
    delete (globalThis as any)[STREAM_GLOBAL];
    jest.mocked(startTransition).mockClear();
  });

  function setup(seedRev: number) {
    const ledger = getLedger()!;
    const manager = new StreamManager(ledger, seedRev);
    const dispatched: { revs: number[]; inTransition: boolean }[] = [];
    let inTransition = false;
    jest.mocked(startTransition).mockImplementation(fn => {
      inTransition = true;
      dispatched.push({ revs: [], inTransition: true });
      try {
        fn();
      } finally {
        inTransition = false;
      }
    });
    const controller: any = {
      dispatch: jest.fn((action: any) => {
        expect(action.type).toBe(PIECE);
        if (!inTransition) dispatched.push({ revs: [], inTransition: false });
        dispatched[dispatched.length - 1].revs.push(action.piece.rev);
        return Promise.resolve();
      }),
    };
    manager.middleware(controller);
    return { ledger, manager, controller, dispatched };
  }

  it('publishes each script batch in one transition, in order, once', () => {
    (globalThis as any)[STREAM_GLOBAL] = [
      { t: 'open', v: 1, rev: 1, at: 0 },
      piece(1),
      piece(2),
      piece(3),
    ];
    const { manager, controller, dispatched } = setup(1);
    expect(typeof controller.reduce).toBe('function');

    manager.init();
    expect(dispatched).toEqual([{ revs: [2, 3], inTransition: true }]);

    push(piece(4), piece(5), piece(6));
    expect(dispatched).toEqual([
      { revs: [2, 3], inTransition: true },
      { revs: [4, 5, 6], inTransition: true },
    ]);

    // a script with nothing new publishes nothing
    push({ t: 'ann', keys: ['k'] });
    expect(dispatched).toHaveLength(2);

    manager.cleanup();
    push(piece(7));
    expect(dispatched).toHaveLength(2);

    // init() resumes from the last piece published
    manager.init();
    expect(dispatched).toEqual([
      { revs: [2, 3], inTransition: true },
      { revs: [4, 5, 6], inTransition: true },
      { revs: [7], inTransition: true },
    ]);
    manager.cleanup();
  });

  it('does not publish before its middleware has a controller', () => {
    (globalThis as any)[STREAM_GLOBAL] = [
      { t: 'open', v: 1, rev: 0, at: 0 },
      piece(1),
    ];
    const ledger = getLedger()!;
    const manager = new StreamManager(ledger, 0);
    manager.init();
    expect(startTransition).not.toHaveBeenCalled();
    manager.cleanup();
  });
});
