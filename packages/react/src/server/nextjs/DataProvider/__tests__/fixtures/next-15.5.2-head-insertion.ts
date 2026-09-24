/**
 * Verbatim copies of the Next.js stream transforms that decide where
 * `useServerInsertedHTML` output lands, so the streaming tests exercise the
 * real insertion semantics (into `</head>` on the first chunk, before every
 * later chunk, once more at stream end; chunks coalesced per setImmediate).
 *
 * Source: vercel/next.js v15.5.2 (commit 497ec6aa08a33f9e2d65a5c8461f550c2549d3e6)
 *   packages/next/src/server/stream-utils/node-web-streams-helper.ts
 *     createBufferedTransformStream, createHeadInsertionTransformStream, streamToString
 *   packages/next/src/server/stream-utils/uint8array-helpers.ts (indexOfUint8Array)
 *   packages/next/src/server/stream-utils/encoded-tags.ts (ENCODED_TAGS.CLOSED.HEAD)
 *   packages/next/src/lib/detached-promise.ts, packages/next/src/lib/scheduler.ts
 *
 * Copyright (c) 2025 Vercel, Inc. Licensed under the MIT License.
 * Only formatting and import inlining changed.
 */
/* eslint-disable */

const encoder = new TextEncoder();

class DetachedPromise<T = any> {
  public readonly resolve: (value: T | PromiseLike<T>) => void;
  public readonly reject: (reason: any) => void;
  public readonly promise: Promise<T>;

  constructor() {
    let resolve: (value: T | PromiseLike<T>) => void;
    let reject: (reason: any) => void;
    this.promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    this.resolve = resolve!;
    this.reject = reject!;
  }
}

const scheduleImmediate = (cb: () => void): void => {
  setImmediate(cb);
};

const CLOSED_HEAD = new Uint8Array([60, 47, 104, 101, 97, 100, 62]);

function indexOfUint8Array(a: Uint8Array, b: Uint8Array) {
  if (b.length === 0) return 0;
  if (a.length === 0 || b.length > a.length) return -1;

  for (let i = 0; i <= a.length - b.length; i++) {
    let completeMatch = true;
    for (let j = 0; j < b.length; j++) {
      if (a[i + j] !== b[j]) {
        completeMatch = false;
        break;
      }
    }
    if (completeMatch) {
      return i;
    }
  }
  return -1;
}

export async function streamToString(
  stream: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
): Promise<string> {
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let string = '';

  for await (const chunk of stream as any) {
    if (signal?.aborted) {
      return string;
    }
    string += decoder.decode(chunk, { stream: true });
  }
  string += decoder.decode();
  return string;
}

export function createBufferedTransformStream(): TransformStream<
  Uint8Array,
  Uint8Array
> {
  let bufferedChunks: Array<Uint8Array> = [];
  let bufferByteLength: number = 0;
  let pending: DetachedPromise<void> | undefined;

  const flush = (controller: TransformStreamDefaultController) => {
    // If we already have a pending flush, then return early.
    if (pending) return;

    const detached = new DetachedPromise<void>();
    pending = detached;

    scheduleImmediate(() => {
      try {
        const chunk = new Uint8Array(bufferByteLength);
        let copiedBytes = 0;

        for (let i = 0; i < bufferedChunks.length; i++) {
          const bufferedChunk = bufferedChunks[i];
          chunk.set(bufferedChunk, copiedBytes);
          copiedBytes += bufferedChunk.byteLength;
        }
        // We just wrote all the buffered chunks so we need to reset the bufferedChunks array
        // and our bufferByteLength to prepare for the next round of buffered chunks
        bufferedChunks.length = 0;
        bufferByteLength = 0;
        controller.enqueue(chunk);
      } catch {
        // If an error occurs while enqueuing it can't be due to this
        // transformers fault. It's likely due to the controller being
        // errored due to the stream being cancelled.
      } finally {
        pending = undefined;
        detached.resolve();
      }
    });
  };

  return new TransformStream({
    transform(chunk, controller) {
      // Combine the previous buffer with the new chunk.
      bufferedChunks.push(chunk);
      bufferByteLength += chunk.byteLength;

      // Flush the buffer to the controller.
      flush(controller);
    },
    flush() {
      if (!pending) return;

      return pending.promise;
    },
  });
}

export function createHeadInsertionTransformStream(
  insert: () => Promise<string>,
): TransformStream<Uint8Array, Uint8Array> {
  let inserted = false;

  // We need to track if this transform saw any bytes because if it didn't
  // we won't want to insert any server HTML at all
  let hasBytes = false;

  return new TransformStream({
    async transform(chunk, controller) {
      hasBytes = true;

      const insertion = await insert();
      if (inserted) {
        if (insertion) {
          const encodedInsertion = encoder.encode(insertion);
          controller.enqueue(encodedInsertion);
        }
        controller.enqueue(chunk);
      } else {
        const index = indexOfUint8Array(chunk, CLOSED_HEAD);
        // In fully static rendering or non PPR rendering cases:
        // `/head>` will always be found in the chunk in first chunk rendering.
        if (index !== -1) {
          if (insertion) {
            const encodedInsertion = encoder.encode(insertion);
            const insertedHeadContent = new Uint8Array(
              chunk.length + encodedInsertion.length,
            );
            insertedHeadContent.set(chunk.slice(0, index));
            insertedHeadContent.set(encodedInsertion, index);
            insertedHeadContent.set(
              chunk.slice(index),
              index + encodedInsertion.length,
            );
            controller.enqueue(insertedHeadContent);
          } else {
            controller.enqueue(chunk);
          }
          inserted = true;
        } else {
          // This will happens in PPR rendering during next start, when the page is partially rendered.
          // When the page resumes, the head tag will be found in the middle of the chunk.
          if (insertion) {
            controller.enqueue(encoder.encode(insertion));
          }
          controller.enqueue(chunk);
          inserted = true;
        }
      }
    },
    async flush(controller) {
      // Check before closing if there's anything remaining to insert.
      if (hasBytes) {
        const insertion = await insert();
        if (insertion) {
          controller.enqueue(encoder.encode(insertion));
        }
      }
    },
  });
}
