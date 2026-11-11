import type { State } from '@data-client/core';

import { foldPieces } from './applyPiece.js';
import { STREAM_GLOBAL, WIRE_VERSION, isUnsafeKey } from './wire.js';
import type {
  PieceMessage,
  StreamMessage,
  WireEndpointMeta,
  WireEntityMeta,
  WireExpiry,
} from './wire.js';

export interface Ledger {
  /** Shell revision. Undefined until `open` arrives. */
  readonly shellRev: number | undefined;
  /** Latest revision received */
  readonly rev: number;
  readonly ended: boolean;
  /** Client clock (ms) that corresponds to the server's `open.at` */
  readonly openedAt: number;
  /**
   * Resolves when `open` or `end` arrives. Always the same promise.
   * Callers check `shellRev` and `ended` first and call `use()` only when both are unset.
   */
  whenOpen(): Promise<void>;
  /** Entity objects that came from a piece, and so from the server, not from a client write */
  readonly placed: WeakSet<object>;
  /** Server state at `rev`, in tables no other state shares. Not cached. */
  fold(rev: number): State<unknown>;
  /** `fold(rev)` with every entry reported unexpired */
  snapshot(rev: number): State<unknown>;
  /** Pieces with a revision above `rev`, in order */
  after(rev: number): readonly PieceMessage[];
  /** Calls `listener` after each script's messages are appended. Returns unsubscribe. */
  subscribe(listener: () => void): () => void;
  /** Pin of boundary `id`, if it has arrived and the boundary has not committed */
  pin(id: string): number | undefined;
  /** Resolves with the pin, or `null` when the stream ends without one. Same promise per id. */
  whenPin(id: string): Promise<number | null>;
  /** First commit of the boundary with this id. Drops its pin now and later. Idempotent. */
  commit(id: string): void;
  /** True when the server announced this endpoint key. For the waiter in PR 3. */
  announced(key: string): boolean;
  /** Counts held, for tests and devtools */
  stats(): { pieces: number; pins: number };
}

/** A promise `use()` reads without suspending once it settled */
interface Tracked<T> extends Promise<T> {
  status?: 'fulfilled';
  value?: T;
  settle(value: T): void;
}

function tracked<T>(): Tracked<T> {
  let resolve!: (value: T) => void;
  let settled = false;
  const promise = new Promise<T>(r => {
    resolve = r;
  }) as Tracked<T>;
  // `use()` sets `status: 'pending'` on a promise it has not seen settle,
  // so `status` cannot tell whether this one has
  promise.settle = value => {
    if (settled) return;
    settled = true;
    promise.status = 'fulfilled';
    promise.value = value;
    resolve(value);
  };
  return promise;
}

function fulfilled<T>(value: T): Tracked<T> {
  const promise = tracked<T>();
  promise.settle(value);
  return promise;
}

class DocumentLedger implements Ledger {
  shellRev: number | undefined = undefined;
  rev = 0;
  ended = false;
  openedAt = 0;
  readonly placed = new WeakSet<object>();
  protected shift = 0;
  protected pieces: PieceMessage[] = [];
  protected pins = new Map<string, number>();
  protected committed = new Set<string>();
  protected pinWaiters = new Map<string, Tracked<number | null>>();
  protected open = tracked<void>();
  protected keys = new Set<string>();
  protected listeners = new Set<() => void>();
  /** Highest revision `after()` handed to the publisher */
  protected handedOut = 0;

  receive(messages: readonly StreamMessage[]) {
    for (const message of messages) this.intake(message);
    this.release();
    for (const listener of [...this.listeners]) listener();
  }

  protected intake(message: StreamMessage) {
    if (this.ended || message === null || typeof message !== 'object') return;
    switch (message.t) {
      case 'open':
        if (message.v !== WIRE_VERSION) {
          /* istanbul ignore else */
          if (process.env.NODE_ENV !== 'production')
            console.warn(
              `Data Client: streamed data has wire version ${message.v}; this build reads ${WIRE_VERSION}. Ignoring the stream.`,
            );
          this.finish();
          return;
        }
        this.openedAt = Date.now();
        this.shift = this.openedAt - message.at;
        this.shellRev = message.rev;
        this.rev = Math.max(this.rev, message.rev);
        this.open.settle(undefined);
        return;
      case 'piece':
        this.pieces.push(this.adopt(message));
        this.rev = Math.max(this.rev, message.rev);
        return;
      case 'pin': {
        if (isUnsafeKey(message.id) || this.committed.has(message.id)) return;
        this.pins.set(message.id, message.rev);
        this.pinWaiters.get(message.id)?.settle(message.rev);
        return;
      }
      case 'ann':
        for (const key of message.keys) this.keys.add(key);
        return;
      case 'end':
        this.finish();
    }
  }

  protected finish() {
    this.ended = true;
    this.open.settle(undefined);
    for (const waiter of this.pinWaiters.values()) waiter.settle(null);
  }

  /** Shifts meta times to the client clock, records placed objects and drops unsafe keys */
  protected adopt(message: PieceMessage): PieceMessage {
    const piece: PieceMessage = { t: 'piece', rev: message.rev };
    if (message.entities) {
      piece.entities = mapTables(message.entities, value => {
        if (typeof value === 'object' && value !== null) this.placed.add(value);
        return value;
      });
    }
    if (message.entitiesMeta) {
      piece.entitiesMeta = mapTables(
        message.entitiesMeta,
        meta => meta && this.shiftEntityMeta(meta),
      );
    }
    if (message.indexes) {
      piece.indexes = {};
      for (const key in message.indexes) {
        if (isUnsafeKey(key)) continue;
        piece.indexes[key] = mapTables(message.indexes[key], v => v);
      }
    }
    if (message.endpoints)
      piece.endpoints = mapTable(message.endpoints, v => v);
    if (message.meta) {
      piece.meta = mapTable(
        message.meta,
        meta => meta && this.shiftEndpointMeta(meta),
      );
    }
    return piece;
  }

  protected shiftEntityMeta(meta: WireEntityMeta): WireEntityMeta {
    return {
      fetchedAt: meta.fetchedAt + this.shift,
      date: meta.date + this.shift,
      expiresAt: this.shiftExpiry(meta.expiresAt),
    };
  }

  protected shiftExpiry(expiresAt: WireExpiry): number {
    return expiresAt === null ? Infinity : expiresAt + this.shift;
  }

  protected shiftEndpointMeta(meta: WireEndpointMeta): WireEndpointMeta {
    const out = {
      ...meta,
      fetchedAt: meta.fetchedAt + this.shift,
      date: meta.date + this.shift,
      expiresAt: this.shiftExpiry(meta.expiresAt),
    };
    if (meta.prevExpiresAt !== undefined)
      out.prevExpiresAt = this.shiftExpiry(meta.prevExpiresAt);
    if (meta.error !== undefined) {
      const error: any = new Error(meta.error.message);
      error.name = meta.error.name;
      if (meta.error.status !== undefined) error.status = meta.error.status;
      out.error = error;
    }
    return out;
  }

  /** Drops the pieces once nothing can read them: stream ended, no pin left, all published */
  protected release() {
    if (
      this.ended &&
      this.pins.size === 0 &&
      this.handedOut >= this.rev &&
      this.pieces.length
    )
      this.pieces = [];
  }

  whenOpen(): Promise<void> {
    return this.open;
  }

  fold(rev: number): State<unknown> {
    return foldPieces(this.pieces, rev);
  }

  snapshot(rev: number): State<unknown> {
    return foldPieces(this.pieces, rev, true);
  }

  after(rev: number): readonly PieceMessage[] {
    const out = this.pieces.filter(piece => piece.rev > rev);
    if (out.length)
      this.handedOut = Math.max(this.handedOut, out[out.length - 1].rev);
    else this.handedOut = Math.max(this.handedOut, rev);
    this.release();
    return out;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  pin(id: string): number | undefined {
    return this.pins.get(id);
  }

  whenPin(id: string): Promise<number | null> {
    let waiter = this.pinWaiters.get(id);
    if (!waiter) {
      const pin = this.pins.get(id);
      waiter =
        pin !== undefined ? fulfilled<number | null>(pin)
        : this.ended ? fulfilled<number | null>(null)
        : tracked<number | null>();
      this.pinWaiters.set(id, waiter);
    }
    return waiter;
  }

  commit(id: string): void {
    this.committed.add(id);
    this.pins.delete(id);
    this.pinWaiters.delete(id);
    this.release();
  }

  announced(key: string): boolean {
    return this.keys.has(key);
  }

  stats() {
    return { pieces: this.pieces.length, pins: this.pins.size };
  }
}

function mapTable<T, U>(
  table: { [key: string]: T },
  convert: (value: T) => U,
): { [key: string]: U } {
  const out: { [key: string]: U } = {};
  for (const key in table) {
    if (isUnsafeKey(key)) continue;
    out[key] = convert(table[key]);
  }
  return out;
}

function mapTables<T, U>(
  tables: { [key: string]: { [pk: string]: T } },
  convert: (value: T) => U,
): { [key: string]: { [pk: string]: U } } {
  const out: { [key: string]: { [pk: string]: U } } = {};
  for (const key in tables) {
    if (isUnsafeKey(key)) continue;
    out[key] = mapTable(tables[key], convert);
  }
  return out;
}

interface StreamQueue extends Array<StreamMessage> {
  ledger?: DocumentLedger;
}

/**
 * The document's ledger. Created on first call and attached to the global queue,
 * replaying messages pushed before it existed. Undefined where there is no `document`.
 */
export function getLedger(): Ledger | undefined {
  if (typeof document === 'undefined') return undefined;
  const global = globalThis as any;
  const queue: StreamQueue = (global[STREAM_GLOBAL] ??= []);
  if (queue.ledger) return queue.ledger;
  const ledger = new DocumentLedger();
  const early = queue.splice(0, queue.length);
  queue.ledger = ledger;
  // The ledger keeps what it needs; the queue holds nothing after this
  queue.push = (...messages: StreamMessage[]) => {
    ledger.receive(messages);
    return 0;
  };
  ledger.receive(early);
  return ledger;
}
