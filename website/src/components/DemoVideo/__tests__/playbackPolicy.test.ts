/// <reference types="jest" />

import {
  shouldPlay,
  viewportFromEntry,
  type PlaybackPolicy,
} from '../playbackPolicy';

const autoplay: PlaybackPolicy = {
  enabled: true,
  documentVisible: true,
  viewport: 'visible',
  userIntent: 'automatic',
};

describe('shouldPlay', () => {
  test('autoplay requires a verified visible viewport and foreground page', () => {
    expect(shouldPlay(autoplay)).toBe(true);
    expect(shouldPlay({ ...autoplay, documentVisible: false })).toBe(false);
    expect(shouldPlay({ ...autoplay, viewport: 'unknown' })).toBe(false);
    expect(shouldPlay({ ...autoplay, viewport: 'hidden' })).toBe(false);
    expect(shouldPlay({ ...autoplay, enabled: false })).toBe(false);
  });

  test('user pause wins over automatic and explicit resume paths', () => {
    expect(shouldPlay({ ...autoplay, userIntent: 'paused' })).toBe(false);
  });

  test('explicit Play may start without a verified viewport while the page is visible', () => {
    expect(
      shouldPlay({ ...autoplay, viewport: 'unknown', userIntent: 'requested' }),
    ).toBe(true);
    expect(
      shouldPlay({ ...autoplay, enabled: false, userIntent: 'requested' }),
    ).toBe(true);
    expect(
      shouldPlay({
        ...autoplay,
        documentVisible: false,
        userIntent: 'requested',
      }),
    ).toBe(false);
    expect(
      shouldPlay({ ...autoplay, viewport: 'hidden', userIntent: 'requested' }),
    ).toBe(false);
  });
});

describe('viewportFromEntry', () => {
  test('requires both intersection and the configured ratio', () => {
    expect(
      viewportFromEntry(
        { isIntersecting: true, intersectionRatio: 0.25 },
        0.25,
      ),
    ).toBe('visible');
    expect(
      viewportFromEntry({ isIntersecting: true, intersectionRatio: 1 }, 0.25),
    ).toBe('visible');
    expect(
      viewportFromEntry(
        { isIntersecting: true, intersectionRatio: 0.249 },
        0.25,
      ),
    ).toBe('hidden');
    expect(
      viewportFromEntry(
        { isIntersecting: false, intersectionRatio: 0.5 },
        0.25,
      ),
    ).toBe('hidden');
  });
});
