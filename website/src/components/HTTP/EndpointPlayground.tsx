import clsx from 'clsx';
import React from 'react';

import Request from './Request';
import Response from './Response';
import styles from './styles.module.css';
import { useCodeDocuments } from '../Playground/editor/codeModel';
import EditorSurface from '../Playground/editor/EditorSurface';
import playgroundstyles from '../Playground/styles.module.css';

/** The code as a row playground's, and beside it (under it when narrow) the
 * HTTP exchange it makes: a folder whose header is the request, curving out
 * into the response's sheet */
export default function EndpointPlayground({
  input,
  init,
  response,
  status,
  children,
}: Props) {
  const model = useCodeDocuments(children);

  return (
    <div className={playgroundstyles.playgroundQueryContainer}>
      <div
        className={clsx(
          playgroundstyles.playgroundContainer,
          playgroundstyles.row,
          styles.exchange,
        )}
      >
        <EditorSurface {...model} layout="row" variant="standalone" />
        <div
          className={clsx(
            playgroundstyles.previewSlot,
            playgroundstyles.stageHues,
            styles.folder,
          )}
        >
          <Request input={input} init={init} />
          {status ?
            <Response status={status} response={response} />
          : null}
        </div>
      </div>
    </div>
  );
}

interface Props {
  input: RequestInfo;
  init: RequestInit;
  response: JSON;
  status: number;
  children: React.ReactNode;
}
