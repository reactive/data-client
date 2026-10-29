import Translate, { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React, { memo } from 'react';

import Clipped from './Clipped';
import Json from './Json';
import styles from './styles.module.css';
import playgroundstyles from '../Playground/styles.module.css';

/** The folder's header: method and URL on one line, the headers that say
 * something, and the body */
// EndpointPlayground re-renders as its code is edited, the exchange only
// when the code's request changes
export default memo(Request);

function Request({ input, init, busy }: Props) {
  const headers = [...new Headers(init.headers)];
  const url = `${input}`;
  const json = headers.find(isJson);
  const rest = headers.filter(header => !isJson(header));
  return (
    <div
      className={clsx(playgroundstyles.folderHead, styles.request)}
      role="group"
      aria-label={translate({ id: 'http.request', message: 'Request' })}
      aria-busy={busy || undefined}
    >
      <div className={styles.requestLine}>
        <span className={styles.method}>{init.method ?? 'GET'}</span>
        {/* keyed, so a new URL replays its flash */}
        <Clipped
          key={url}
          className={clsx(styles.url, styles.fresh)}
          full={url}
        >
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
        {init.credentials ?
          <Clipped
            className={styles.chip}
            full={`credentials: ${init.credentials}`}
            always
          >
            {init.credentials === 'omit' ?
              translate({
                id: 'http.credentials.omit',
                message: 'no cookies',
                description: "Chip for fetch's credentials: 'omit' option",
              })
            : translate({
                id: 'http.credentials',
                message: 'cookies',
                description:
                  "Chip for fetch's credentials option, which sends the browser's cookies",
              })
            }
          </Clipped>
        : null}
      </div>
      {rest.length ?
        <dl className={styles.headers}>
          {rest.map(([key, value]) => (
            <React.Fragment key={key}>
              <dt>{key}</dt>
              <dd>{value}</dd>
            </React.Fragment>
          ))}
        </dl>
      : null}
      {typeof init.body === 'string' ?
        <Json
          key={init.body}
          className={clsx(styles.requestBody, styles.fresh)}
          text={pretty(init.body)}
        />
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
  /** The code changed and no longer makes this request */
  busy?: boolean;
}
