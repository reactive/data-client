/* global copy */
// Paste into the browser console to copy the store for a bug report.
copy(
  JSON.stringify(
    globalThis.__DC_CONTROLLERS__.get('Data Client: Chat').getState(),
  ),
);
