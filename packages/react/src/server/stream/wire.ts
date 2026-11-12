export const WIRE_VERSION = 1;
/** Name of the array on `globalThis` that inline scripts push messages to */
export const STREAM_GLOBAL = '__RDC_STREAM__';

export interface WireError {
  name: string;
  message: string;
  status?: number;
}
/** JSON writes a number that is not finite as `null`; for an expiry that means never */
export type WireExpiry = number | null;
export interface WireEntityMeta {
  fetchedAt: number;
  date: number;
  expiresAt: WireExpiry;
}
export interface WireEndpointMeta {
  date: number;
  fetchedAt: number;
  expiresAt: WireExpiry;
  prevExpiresAt?: WireExpiry;
  error?: WireError;
  invalidated?: boolean;
  errorPolicy?: 'hard' | 'soft';
}

/**
 * Normalized slots one committed server change wrote.
 * In `entities`, `entitiesMeta` and `indexes`, `null` means the slot was removed, and `0`
 * in `entities` (and as an index value) means INVALID. Every value in `endpoints` and
 * `meta` is a value; endpoint removals are listed in `x`.
 */
export interface PieceSlots {
  entities?: { [entityKey: string]: { [pk: string]: object | 0 | null } };
  entitiesMeta?: {
    [entityKey: string]: { [pk: string]: WireEntityMeta | null };
  };
  /** Index entries that changed: value to pk. `null` removes the entry. */
  indexes?: {
    [entityKey: string]: {
      [indexName: string]: { [value: string]: string | 0 | null };
    };
  };
  endpoints?: { [key: string]: unknown };
  meta?: { [key: string]: WireEndpointMeta };
  /** Endpoint keys whose result or meta was removed. Applied before `endpoints` and `meta`. */
  x?: string[];
}

/** First message of a document */
export interface OpenMessage {
  t: 'open';
  v: typeof WIRE_VERSION;
  /** Revision the shell was rendered from */
  rev: number;
  /** Server clock (ms) when the stream opened */
  at: number;
}
export interface PieceMessage extends PieceSlots {
  t: 'piece';
  rev: number;
}
/** The revision a boundary was rendered from, keyed by its `useId` */
export interface PinMessage {
  t: 'pin';
  id: string;
  rev: number;
}
/** Endpoint keys the server started to fetch. Read by the waiter in PR 3. */
export interface AnnounceMessage {
  t: 'ann';
  keys: string[];
}
export interface EndMessage {
  t: 'end';
}
export type StreamMessage =
  OpenMessage | PieceMessage | PinMessage | AnnounceMessage | EndMessage;

/** Keys a message may not create on an object */
export const isUnsafeKey = (key: string) =>
  key === '__proto__' || key === 'constructor' || key === 'prototype';
