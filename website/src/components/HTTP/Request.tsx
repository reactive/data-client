import Translate from '@docusaurus/Translate';
import clsx from 'clsx';
import React, { memo } from 'react';

import Clipped from './Clipped';
import Json from './Json';
import styles from './styles.module.css';
import playgroundstyles from '../Playground/styles.module.css';

/** The folder's header: method and URL on one line, the headers that say
 * something, and the body */
export default memo(Request);

function Request({ input, init }: Props) {
  const headers = [...new Headers(init.headers)];
  const url = `${input}`;
  const json = headers.find(isJson);
  return (
    <div className={clsx(playgroundstyles.folderHead, styles.request)}>
      <div className={styles.requestLine}>
        <span className={styles.method}>{init.method ?? 'GET'}</span>
        <Clipped className={styles.url} full={url}>
          {url}
        </Clipped>
        {json ?
          <Clipped className={styles.chip} full={json.join(': ')} always>
            <Translate
              id="http.json"
              description="Chip for the content-type: application/json header"
            >
              json
            </Translate>
          </Clipped>
        : null}
      </div>
      <dl className={styles.headers}>
        {headers
          .filter(header => !isJson(header))
          .map(([key, value]) => (
            <React.Fragment key={key}>
              <dt>{key}</dt>
              <dd>{value}</dd>
            </React.Fragment>
          ))}
      </dl>
      {typeof init.body === 'string' ?
        <Json className={styles.requestBody} text={pretty(init.body)} />
      : null}
    </div>
  );
}

/** Nearly every request sends it, so it folds to a chip on the request line */
const isJson = ([key, value]: [string, string]) =>
  key === 'content-type' && value === 'application/json';

function pretty(body: string) {
  try {
    return JSON.stringify(JSON.parse(body), undefined, 2);
  } catch {
    return body;
  }
}

interface Props {
  input: RequestInfo;
  init: RequestInit;
}
