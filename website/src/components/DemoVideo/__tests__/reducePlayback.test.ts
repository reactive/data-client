/// <reference types="jest" />

import { reducePlayback } from '../reducePlayback';
import type { DemoPlaybackState } from '../types';

const dormant: DemoPlaybackState = { status: 'dormant' };

describe('reducePlayback', () => {
  test('entering view starts loading from dormant or out-of-view pause', () => {
    expect(
      reducePlayback(dormant, { type: 'visibility', inView: true }),
    ).toEqual({ status: 'loading' });
    expect(
      reducePlayback(
        { status: 'paused', reason: 'out-of-view' },
        { type: 'visibility', inView: true },
      ),
    ).toEqual({ status: 'loading' });
  });

  test('user pause does not resume on re-entry', () => {
    expect(
      reducePlayback(
        { status: 'paused', reason: 'user' },
        { type: 'visibility', inView: true },
      ),
    ).toEqual({ status: 'paused', reason: 'user' });
  });

  test('leaving view pauses playing or loading media as out-of-view', () => {
    expect(
      reducePlayback(
        { status: 'playing' },
        { type: 'visibility', inView: false },
      ),
    ).toEqual({ status: 'paused', reason: 'out-of-view' });
    expect(
      reducePlayback(
        { status: 'loading' },
        { type: 'visibility', inView: false },
      ),
    ).toEqual({ status: 'paused', reason: 'out-of-view' });
    expect(
      reducePlayback(
        { status: 'paused', reason: 'user' },
        { type: 'visibility', inView: false },
      ),
    ).toEqual({ status: 'paused', reason: 'user' });
  });

  test('user play loads, user pause sticks, playing and errors land', () => {
    expect(reducePlayback(dormant, { type: 'user-play' })).toEqual({
      status: 'loading',
    });
    expect(
      reducePlayback({ status: 'playing' }, { type: 'user-pause' }),
    ).toEqual({ status: 'paused', reason: 'user' });
    expect(reducePlayback({ status: 'loading' }, { type: 'playing' })).toEqual({
      status: 'playing',
    });
    expect(reducePlayback({ status: 'loading' }, { type: 'blocked' })).toEqual({
      status: 'blocked',
    });
    expect(reducePlayback({ status: 'playing' }, { type: 'error' })).toEqual({
      status: 'error',
    });
  });

  test('waiting only demotes an already-playing stream', () => {
    expect(reducePlayback({ status: 'playing' }, { type: 'waiting' })).toEqual({
      status: 'loading',
    });
    expect(reducePlayback(dormant, { type: 'waiting' })).toEqual(dormant);
  });
});
