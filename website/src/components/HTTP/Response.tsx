import { translate } from '@docusaurus/Translate';
import { memo } from 'react';

import Json from './Json';
import styles from './styles.module.css';

/** The sheet the request's header curves out into: the body, its status at
 * the end of the first line */
// EndpointPlayground re-renders as its code is edited; the exchange never changes
export default memo(Response);

function Response({ response, status }: Props) {
  return (
    <div
      className={styles.response}
      role="group"
      aria-label={translate({ id: 'http.response', message: 'Response' })}
    >
      <div className={styles.sheet}>
        <span className={styles.status} data-error={status >= 400 || undefined}>
          {STATUS_TEXT[status] ? `${status} ${STATUS_TEXT[status]}` : status}
        </span>
        {response !== undefined ?
          <Json text={JSON.stringify(response, undefined, 2)} />
        : null}
      </div>
    </div>
  );
}
interface Props {
  response: JSON;
  status: number;
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
