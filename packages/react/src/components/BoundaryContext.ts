'use client';
import { createContext } from 'react';
import type { Context, ReactElement, ReactNode } from 'react';

/**
 * Builds the Suspense of an AsyncBoundary. Provided by a streaming SSR adapter.
 * @internal
 */
export type BoundaryWrap = (
  suspenseProps: { fallback?: ReactNode },
  content: ReactElement,
) => ReactElement;

/** @internal */
export const BoundaryContext: Context<BoundaryWrap | null> =
  createContext<BoundaryWrap | null>(null);
