import { translate } from '@docusaurus/Translate';
import { memo } from 'react';

import { ResponseDefinition } from './Definition';
import Json from './Json';
import styles from './styles.module.css';

/** The sheet the request's header curves out into: the body, its status at
 * the end of the first line, and the options that read it (a Resource
 * member's schema and process) */
// EndpointPlayground re-renders as its code is edited, the exchange only
// when the code's request changes
export default memo(Response);

function Response({ status, response, busy }: Props) {
  return (
    <ResponseSheet busy={busy}>
      <span className={styles.status} data-error={status >= 400 || undefined}>
        {STATUS_TEXT[status] ? `${status} ${STATUS_TEXT[status]}` : status}
      </span>
      {response !== undefined ?
        <Json text={JSON.stringify(response, undefined, 2)} />
      : null}
      <ResponseDefinition />
    </ResponseSheet>
  );
}

/** The response's place, holding a response or what kept one from coming */
export function ResponseSheet({
  busy,
  children,
}: {
  busy?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={styles.response}
      role="group"
      aria-label={translate({ id: 'http.response', message: 'Response' })}
      aria-busy={busy || undefined}
    >
      <div className={styles.sheet}>{children}</div>
    </div>
  );
}

interface Props {
  status: number;
  response?: unknown;
  /** The code changed and no longer makes this exchange */
  busy?: boolean;
}

const STATUS_TEXT: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  204: 'No Content',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Content',
  500: 'Internal Server Error',
};
