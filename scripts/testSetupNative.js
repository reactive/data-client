// React Native installs these globals at startup (Libraries/Core/setUpTimers), but its jest environment does not
if (typeof globalThis.requestIdleCallback !== 'function') {
  globalThis.requestIdleCallback = callback =>
    setTimeout(
      () => callback({ didTimeout: false, timeRemaining: () => 50 }),
      1,
    );
  globalThis.cancelIdleCallback = handle => clearTimeout(handle);
}
