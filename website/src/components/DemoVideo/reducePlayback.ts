import type { DemoPlaybackState, PlaybackEvent } from './types';

export function reducePlayback(
  state: DemoPlaybackState,
  event: PlaybackEvent,
): DemoPlaybackState {
  switch (event.type) {
    case 'visibility':
      if (!event.inView) {
        if (state.status === 'playing' || state.status === 'loading') {
          return { status: 'paused', reason: 'out-of-view' };
        }
        return state;
      }
      if (state.status === 'paused' && state.reason === 'out-of-view') {
        return { status: 'loading' };
      }
      if (state.status === 'dormant') {
        return { status: 'loading' };
      }
      return state;
    case 'user-play':
      return { status: 'loading' };
    case 'user-pause':
      return { status: 'paused', reason: 'user' };
    case 'playing':
      return state.status === 'playing' ? state : { status: 'playing' };
    case 'waiting':
      return state.status === 'playing' ? { status: 'loading' } : state;
    case 'blocked':
      return { status: 'blocked' };
    case 'error':
      return { status: 'error' };
  }
}
