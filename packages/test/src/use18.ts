import React from 'react';

// @testing-library/react-hooks does not support node/SSR, so we must fallback to previous testing
export const USE18 =
  React.version.startsWith('18') && typeof document !== 'undefined';
