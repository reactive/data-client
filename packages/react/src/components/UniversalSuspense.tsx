import React, { Suspense } from 'react';
import type { JSX } from 'react';

import { LegacyReact, SSR } from './LegacyReact.js';

// since Suspense does not introduce DOM elements, this should not affect rehydration.
/** Suspense but compatible with 18 SSR, 17, 16 and native */
const UniversalSuspense: React.FunctionComponent<{
  children?: React.ReactNode;
  fallback: React.ReactNode;
}> =
  /* istanbul ignore if */
  LegacyReact && SSR ?
    /* istanbul ignore next  */ ({ children }) => children as JSX.Element
  : Suspense;

if (LegacyReact && SSR) {
  UniversalSuspense.defaultProps = { children: null };
}
export default UniversalSuspense;
