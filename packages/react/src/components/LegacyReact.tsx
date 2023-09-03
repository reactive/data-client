import { version } from 'react';

/* istanbul ignore next  */
export const LegacyReact = version.startsWith('16') || version.startsWith('17');
/* istanbul ignore next  */
export const SSR = typeof window === 'undefined';
