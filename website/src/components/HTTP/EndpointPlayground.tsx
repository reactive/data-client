import clsx from 'clsx';
import React, { lazy, useContext, useDeferredValue, useState } from 'react';

import PendingExchange from './PendingExchange';
import Request from './Request';
import Response, { ResponseSheet } from './Response';
import styles from './styles.module.css';
import Boundary from '../Playground/Boundary';
import { useCodeDocuments } from '../Playground/editor/codeModel';
import EditorSurface from '../Playground/editor/EditorSurface';
import ErrorPanel from '../Playground/ErrorPanel';
import { PlaygroundHiddenContext } from '../Playground/hiddenContext';
import type LiveExchangeType from '../Playground/preview/exchange/LiveExchange';
import type { LiveState } from '../Playground/preview/exchange/LiveExchange';
import playgroundstyles from '../Playground/styles.module.css';
import type { FixtureOrInterceptor } from '../Playground/types';
import { isBot } from '../Playground/userAgent';

/** The code as a row playground's, and beside it (under it when narrow) the
 * HTTP exchange it makes: a folder whose header is the request, curving out
 * into the response's sheet.
 *
 * Live, the code runs as it is edited: the request is what its endpoints
 * send, the response what `fixtures` answer (no fixtures: the request alone).
 * Until every demo is live, `input` and `init` show a fixed request instead,
 * with `status` and `response` its response. */
export default function EndpointPlayground(props: Props) {
  const model = useCodeDocuments(props.children);
  // in a hidden tab (PlaygroundTabs) the code is plain text until first shown
  const hidden = useContext(PlaygroundHiddenContext);
  const [interactive, setInteractive] = useState(!hidden);
  if (!hidden && !interactive) setInteractive(true);
  // the editor stays responsive while the exchange reruns
  const documents = useDeferredValue(model.documents);

  return (
    <div className={playgroundstyles.playgroundQueryContainer}>
      <div
        className={clsx(
          playgroundstyles.playgroundContainer,
          playgroundstyles.row,
          styles.exchange,
        )}
      >
        <EditorSurface
          {...model}
          layout="row"
          variant="standalone"
          interactive={interactive}
        />
        <div
          className={clsx(
            playgroundstyles.previewSlot,
            playgroundstyles.stageHues,
            styles.folder,
          )}
          data-live={!('input' in props) || undefined}
        >
          {'input' in props ?
            <>
              <Request input={props.input} init={props.init} />
              {props.status ?
                <Response status={props.status} response={props.response} />
              : null}
            </>
          : <Boundary
              fallback={<PendingExchange response={!!props.fixtures} />}
            >
              <LiveExchange
                documents={documents}
                fixtures={props.fixtures}
                getInitialInterceptorData={props.getInitialInterceptorData}
              >
                {state => <Live state={state} response={!!props.fixtures} />}
              </LiveExchange>
            </Boundary>
          }
        </div>
      </div>
    </div>
  );
}

// the code runs in the live preview's chunk; bots keep the skeleton
const LiveExchange = lazy<typeof LiveExchangeType>(() =>
  isBot ?
    Promise.resolve({ default: ({ children }) => children({ stale: false }) })
  : import(
      /* webpackChunkName: 'PreviewWithScope', webpackPrefetch: true */ '../Playground/preview/exchange/LiveExchange'
    ),
);

/** The exchange the code makes as it runs: the request, then its response
 * (`response`: fixtures answer it) or the error that kept it from being
 * sent. While an edit makes none, the last one stays, dimmed. */
function Live({ state, response }: { state: LiveState; response: boolean }) {
  const { exchange, stale, error } = state;
  if (!exchange && !error) return <PendingExchange response={response} />;
  return (
    <>
      {exchange ?
        <Request input={exchange.input} init={exchange.init} busy={stale} />
      : null}
      {error ?
        <ResponseSheet>
          <ErrorPanel kind="runtime">{error}</ErrorPanel>
        </ResponseSheet>
      : exchange && response ?
        <Response
          status={exchange.status}
          response={exchange.body}
          busy={stale}
        />
      : null}
    </>
  );
}

type Props = (LiveProps | FixedProps) & { children: React.ReactNode };

export interface LiveProps {
  /** Answer the code's requests; without them it shows the request alone */
  fixtures?: FixtureOrInterceptor[];
  /** `this` of the fixtures' interceptors, fresh each run */
  getInitialInterceptorData?: () => unknown;
}

interface FixedProps {
  input: RequestInfo;
  init: RequestInit;
  response?: unknown;
  status?: number;
}
