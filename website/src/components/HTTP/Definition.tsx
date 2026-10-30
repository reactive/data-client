import { translate } from '@docusaurus/Translate';
import React, { createContext, useContext } from 'react';

import styles from './styles.module.css';

/** The options an endpoint is made from (a Field/Value table, ../MethodInfo),
 * shown where each acts: the request's (path, searchParams, body, ...) under
 * its request line, schema and process at the foot of its response */
export const DefinitionContext = createContext<readonly Field[] | null>(null);

export interface Field {
  key: string;
  value: React.ReactNode;
  /** value is a link to the resource argument of the same name */
  same: boolean;
}

/** method is the request line's own; these two act on the response */
const RESPONSE = ['schema', 'process'];

export function RequestDefinition() {
  const fields = useContext(DefinitionContext)?.filter(
    ({ key }) => key !== 'method' && !RESPONSE.includes(key),
  );
  if (!fields?.length) return null;
  return (
    <div
      className={styles.definition}
      role="group"
      aria-label={translate({
        id: 'http.definition',
        message: 'Made from',
        description: 'The resource options an endpoint request is made from',
      })}
    >
      {fields.map(({ key, value, same }) => (
        <span key={key}>
          {same || key === 'path' ? null : <i>{key} </i>}
          {value}
        </span>
      ))}
    </div>
  );
}

export function ResponseDefinition() {
  const fields = useContext(DefinitionContext)?.filter(({ key }) =>
    RESPONSE.includes(key),
  );
  if (!fields?.length) return null;
  return (
    <dl className={styles.responseDefinition}>
      {fields.map(({ key, value }) => (
        <React.Fragment key={key}>
          <dt>{key}</dt>
          <dd>{value}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}
