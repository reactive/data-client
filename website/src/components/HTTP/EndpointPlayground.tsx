import clsx from 'clsx';
import React, { useContext, useDeferredValue, useMemo, useState } from 'react';

import LiveFolder from './LiveFolder';
import Request from './Request';
import Response from './Response';
import styles from './styles.module.css';
import {
  type CodeDocument,
  useCodeDocuments,
} from '../Playground/editor/codeModel';
import EditorSurface from '../Playground/editor/EditorSurface';
import { PlaygroundHiddenContext } from '../Playground/hiddenContext';
import type { LiveProps } from '../Playground/preview/exchange/LiveExchange';
import playgroundstyles from '../Playground/styles.module.css';

/** The code as a row playground's, and beside it (under it when narrow) the
 * HTTP exchange it makes: a folder whose header is the request, curving out
 * into the response's sheet.
 *
 * Live, the code runs as it is edited: the request is what its endpoints
 * send, the response what `fixtures` answer (no fixtures: the request alone).
 * Until the translations (website/i18n) catch up with the live docs, their
 * `input` and `init` show a fixed request instead, with `status` and
 * `response` its response. */
export default function EndpointPlayground(props: Props) {
  const model = useCodeDocuments(props.children);
  // in a hidden tab (PlaygroundTabs) the code is plain text until first shown
  const hidden = useContext(PlaygroundHiddenContext);
  const [interactive, setInteractive] = useState(!hidden);
  if (!hidden && !interactive) setInteractive(true);
  // the editor stays responsive while the exchange reruns
  const documents = useDeferredValue(model.documents);
  const setup = 'setup' in props ? props.setup : undefined;
  const run = useMemo(() => withSetup(documents, setup), [documents, setup]);

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
          topLevelAwait
        />
        {'input' in props ?
          <div className={folder}>
            <Request input={props.input} init={props.init} />
            {props.status ?
              <Response status={props.status} response={props.response} />
            : null}
          </div>
        : <LiveFolder
            className={folder}
            documents={run}
            fixtures={props.fixtures}
            getInitialInterceptorData={props.getInitialInterceptorData}
          />
        }
      </div>
    </div>
  );
}

const folder = clsx(
  playgroundstyles.previewSlot,
  playgroundstyles.stageHues,
  styles.folder,
);

/** Inserts `setup` as a hidden file before the last one (the Usage), so it
 * runs after the definitions it touches */
function withSetup(documents: readonly CodeDocument[], setup?: string) {
  if (!setup) return documents;
  return [
    ...documents.slice(0, -1),
    { value: setup, path: 'setup.ts', language: 'ts', collapsed: true },
    ...documents.slice(-1),
  ];
}

type Props = (LivePlaygroundProps | FixedProps) & {
  children: React.ReactNode;
};

interface LivePlaygroundProps extends LiveProps {
  /** Hidden code run before the last file, for state the demo assumes
   * (a signed-in token, a cookie) */
  setup?: string;
}

interface FixedProps {
  input: RequestInfo;
  init: RequestInit;
  response?: unknown;
  status?: number;
}
