import useIsBrowser from '@docusaurus/useIsBrowser';
import { lazy, Suspense, use, useId, useState } from 'react';

import PendingExchange from './PendingExchange';
import Request from './Request';
import Response, { ResponseSheet } from './Response';
import type { CodeDocument } from '../Playground/editor/codeModel';
import ErrorPanel from '../Playground/ErrorPanel';
import type * as LiveExchangeModule from '../Playground/preview/exchange/LiveExchange';
import type {
  LiveProps,
  LiveState,
} from '../Playground/preview/exchange/LiveExchange';
import { isBot } from '../Playground/userAgent';

/** The folder of the exchange `documents` make, live as they are edited.
 *
 * The page's HTML already holds the first one: the server runs the code as
 * it renders (no Suspense boundary, so it waits and writes it in place, not
 * revealed later by script), and leaves it as JSON for hydration to read.
 * The code only runs in the browser once edited, after the live preview's
 * chunk loads. */
export default function LiveFolder({
  className,
  documents,
  fixtures,
  getInitialInterceptorData,
}: Props) {
  const id = useId();
  const initial = useFirstExchange(
    id,
    documents,
    fixtures,
    getInitialInterceptorData,
  );
  // hydration renders what the server did; the live code takes over after
  const hydrated = useIsBrowser();

  const answered = !!fixtures;
  const settled =
    initial ?
      <Live state={initial} answered={answered} />
    : <PendingExchange answered={answered} />;
  return (
    <div
      className={className}
      id={id}
      data-first-exchange={initial ? toJson(initial) : undefined}
    >
      {hydrated ?
        <Suspense fallback={settled}>
          <LiveExchange
            documents={documents}
            initial={initial}
            fixtures={fixtures}
            getInitialInterceptorData={getInitialInterceptorData}
          >
            {state => <Live state={state} answered={answered} />}
          </LiveExchange>
        </Suspense>
      : settled}
    </div>
  );
}

const onServer = typeof document === 'undefined';

/** The first exchange: run on the server, read from the page's HTML on the
 * client (absent after a client navigation, which never got it) */
function useFirstExchange(
  id: string,
  documents: readonly CodeDocument[],
  fixtures: LiveProps['fixtures'],
  getInitialInterceptorData: LiveProps['getInitialInterceptorData'],
): LiveState | undefined {
  const [fromHtml] = useState(() => {
    if (!onServer) {
      const json = document.getElementById(id)?.dataset.firstExchange;
      return json ? (JSON.parse(json) as LiveState) : undefined;
    }
  });
  // server and client take different paths to the same render
  if (!onServer) return fromHtml;
  const { firstExchange } = use(loadLiveExchange());
  return use(firstExchange(documents, fixtures, getInitialInterceptorData));
}

/** The exchange as JSON, the same text in the client's render as in the
 * server's (headers as a plain object) */
function toJson({ exchange, error }: LiveState) {
  const state: LiveState = {
    stale: false,
    error,
    exchange: exchange && {
      ...exchange,
      init: {
        ...exchange.init,
        headers: Object.fromEntries(new Headers(exchange.init.headers)),
        signal: undefined,
      },
    },
  };
  return JSON.stringify(state);
}

let liveExchange: Promise<typeof LiveExchangeModule> | undefined;
// the code runs in the live preview's chunk
const loadLiveExchange = () =>
  (liveExchange ??= import(
    /* webpackChunkName: 'PreviewWithScope', webpackPrefetch: true */ '../Playground/preview/exchange/LiveExchange'
  ));
// for bots it never loads: they keep the server's HTML
const LiveExchange = lazy(() =>
  isBot ? new Promise<never>(() => undefined) : loadLiveExchange(),
);

/** The exchange the code makes as it runs: the request, then its response
 * (`answered`: fixtures answer it) or the error that kept it from being
 * sent. While an edit makes none, the last one stays, dimmed. */
function Live({ state, answered }: { state: LiveState; answered: boolean }) {
  const { exchange, stale, error } = state;
  if (!exchange && !error) return <PendingExchange answered={answered} />;
  return (
    <>
      {exchange ?
        <Request input={exchange.input} init={exchange.init} busy={stale} />
      : null}
      {error ?
        <ResponseSheet>
          <ErrorPanel kind="runtime">{error}</ErrorPanel>
        </ResponseSheet>
      : exchange && answered ?
        <Response
          status={exchange.status}
          response={exchange.body}
          busy={stale}
        />
      : null}
    </>
  );
}

interface Props extends LiveProps {
  className: string;
  documents: readonly CodeDocument[];
}
