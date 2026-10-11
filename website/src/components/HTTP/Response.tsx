import Translate from '@docusaurus/Translate';
import CodeBlock from '@theme/CodeBlock';
import clsx from 'clsx';

import styles from './Wrapper.module.css';
import Header from '../Playground/Header';

export default function Response({ response, status }: Props) {
  return (
    <div>
      <Header small className={clsx(styles.doubleTitle)}>
        <span>
          <Translate id="http.response">Response</Translate>
        </span>
        <span
          className={clsx(styles.status, {
            [styles.error]: status >= 400,
          })}
        >
          {STATUS_TEXT[status] ? `${status} ${STATUS_TEXT[status]}` : status}
        </span>
      </Header>
      <CodeBlock language="json" className={styles.containedCode}>
        {response ? JSON.stringify(response, undefined, 2) : 'NO CONTENT'}
      </CodeBlock>
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
