import clsx from 'clsx';
import React, { useContext, useDeferredValue, useState } from 'react';

import LiveFolder from './LiveFolder';
import Request from './Request';
import Response from './Response';
import styles from './styles.module.css';
import { useCodeDocuments } from '../Playground/editor/codeModel';
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
        {'input' in props ?
          <div className={folder}>
            <Request input={props.input} init={props.init} />
            {props.status ?
              <Response status={props.status} response={props.response} />
            : null}
          </div>
        : <LiveFolder
            className={folder}
            documents={documents}
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

type Props = (LiveProps | FixedProps) & { children: React.ReactNode };

interface FixedProps {
  input: RequestInfo;
  init: RequestInit;
  response?: unknown;
  status?: number;
}
