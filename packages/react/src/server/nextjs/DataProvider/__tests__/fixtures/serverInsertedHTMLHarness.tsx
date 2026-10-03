/**
 * Mirrors the parts of Next.js that drive `useServerInsertedHTML`:
 * `server-inserted-html.shared-runtime.tsx` (the hook and its context),
 * `app-render/server-inserted-html.tsx` (callback collection) and
 * `app-render/make-get-server-inserted-html.tsx` (rendering callbacks to a
 * string per flush). Doubles as the virtual `next/navigation` module.
 */
import React, { useContext } from 'react';
import { renderToReadableStream } from 'react-dom/server';

import {
  createBufferedTransformStream,
  createHeadInsertionTransformStream,
  streamToString,
} from './next-15.5.2-head-insertion';

type ServerInsertedHTMLHook = (callback: () => React.ReactNode) => void;

export const ServerInsertedHTMLContext =
  React.createContext<ServerInsertedHTMLHook | null>(null);

export function useServerInsertedHTML(callback: () => React.ReactNode): void {
  const addInsertedServerHTMLCallback = useContext(ServerInsertedHTMLContext);
  if (addInsertedServerHTMLCallback) {
    addInsertedServerHTMLCallback(callback);
  }
}

export function createServerInsertedHTML() {
  const callbacks: (() => React.ReactNode)[] = [];
  const addInsertedHtml: ServerInsertedHTMLHook = handler => {
    callbacks.push(handler);
  };
  return {
    ServerInsertedHTMLProvider({ children }: { children: React.ReactNode }) {
      return (
        <ServerInsertedHTMLContext.Provider value={addInsertedHtml}>
          {children}
        </ServerInsertedHTMLContext.Provider>
      );
    },
    async getServerInsertedHTML(): Promise<string> {
      const stream = await renderToReadableStream(
        <>
          {callbacks.map((callback, index) => (
            <React.Fragment key={'__next_server_inserted__' + index}>
              {callback()}
            </React.Fragment>
          ))}
        </>,
        { progressiveChunkSize: 1024 * 1024 },
      );
      return streamToString(stream);
    },
  };
}

export interface RenderPageOptions {
  /** Static generation waits for the whole tree before flushing anything */
  staticGeneration?: boolean;
  onError?: (error: unknown) => void;
}

/** Streams a document the way Next.js does for an App Router request */
export async function renderPage(
  app: React.ReactNode,
  { staticGeneration = false, onError }: RenderPageOptions = {},
): Promise<string> {
  const { ServerInsertedHTMLProvider, getServerInsertedHTML } =
    createServerInsertedHTML();
  const stream = await renderToReadableStream(
    <ServerInsertedHTMLProvider>
      <html>
        <head>
          <meta charSet="utf-8" />
        </head>
        <body>{app}</body>
      </html>
    </ServerInsertedHTMLProvider>,
    { onError },
  );
  if (staticGeneration) await stream.allReady;
  return streamToString(
    stream
      .pipeThrough(createBufferedTransformStream())
      .pipeThrough(createHeadInsertionTransformStream(getServerInsertedHTML)),
  );
}
