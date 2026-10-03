// Minimal local declaration so @data-client/react/nextjs can type-check
// without depending on `next`. Never shipped: consumers resolve the real
// `next/navigation` types from their own Next.js install.
declare module 'next/navigation' {
  import type { ReactNode } from 'react';

  export function useServerInsertedHTML(callback: () => ReactNode): void;
}
