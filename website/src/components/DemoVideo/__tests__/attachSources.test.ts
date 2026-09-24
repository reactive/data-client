/// <reference types="jest" />

import { shouldAttachSources } from '../attachSources';

describe('shouldAttachSources', () => {
  const ready = {
    prefsReady: true,
    isBot: false,
    nearViewport: true,
    reducedData: false,
    forceAttach: false,
  };

  test('SSR and first hydration stay poster-only until prefs resolve', () => {
    expect(shouldAttachSources({ ...ready, prefsReady: false })).toBe(false);
  });

  test('bots never receive media sources', () => {
    expect(shouldAttachSources({ ...ready, isBot: true })).toBe(false);
    expect(
      shouldAttachSources({ ...ready, isBot: true, forceAttach: true }),
    ).toBe(false);
  });

  test('reduced-data waits for an explicit Play', () => {
    expect(shouldAttachSources({ ...ready, reducedData: true })).toBe(false);
    expect(
      shouldAttachSources({
        ...ready,
        reducedData: true,
        forceAttach: true,
      }),
    ).toBe(true);
  });

  test('off-screen facades do not attach until near the viewport', () => {
    expect(shouldAttachSources({ ...ready, nearViewport: false })).toBe(false);
    expect(shouldAttachSources(ready)).toBe(true);
  });
});
