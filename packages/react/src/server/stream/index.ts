import React from 'react';

/** False on a React without `use` and `useId`. A host then keeps the one-shot handoff. */
export const supported: boolean =
  typeof React.use === 'function' && typeof React.useId === 'function';

export { WIRE_VERSION, STREAM_GLOBAL } from './wire.js';
export type {
  StreamMessage,
  OpenMessage,
  PieceMessage,
  PinMessage,
  AnnounceMessage,
  EndMessage,
  PieceSlots,
} from './wire.js';
export { serialize } from './serialize.js';
export { diffState } from './diffState.js';
export { createServerLedger } from './ServerLedger.js';
export type { ScopedStore, ServerLedger } from './ServerLedger.js';
export { getLedger } from './Ledger.js';
export type { Ledger } from './Ledger.js';
export { APPLY, applyPiece, foldPieces } from './applyPiece.js';
export type { PieceAction, ClassMap } from './applyPiece.js';
export { default as StreamManager } from './StreamManager.js';
export {
  LedgerContext,
  ServerLedgerContext,
  useHydrating,
  useBoundaryCell,
  Boundary,
  Shield,
  Scope,
  ServerBoundary,
  ServerScope,
  clientWrap,
  serverWrap,
} from './boundary.js';
export type { BoundaryCell } from './boundary.js';
export { default as StreamProvider } from './StreamProvider.js';
export type { StreamProviderProps } from './StreamProvider.js';
export { default as createServerStream } from './createServerStream.js';
export type { ServerStream } from './createServerStream.js';
