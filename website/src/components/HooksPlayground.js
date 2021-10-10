import React, { useEffect, useState, memo } from 'react';
import * as restHooks from 'rest-hooks';
import * as rest from '@rest-hooks/rest';
import * as graphql from '@rest-hooks/graphql';
import BigNumber from 'bignumber.js';
import { default as BaseTodoResource } from 'todo-app/src/resources/TodoResource';

import Playground from './Playground';

const mockFetch = (getResponse, name, delay = 150) => {
  const fetch = (...args) =>
    new Promise(resolve =>
      setTimeout(() => resolve(getResponse(...args)), delay),
    );
  if (name)
    Object.defineProperty(fetch, 'name', { value: name, writable: false });
  return fetch;
};

const mockLastUpdated = ({ id }) =>
  fetch(`/api/currentTime/${id}`).then(res => res.json());
class TimedEntity extends rest.Entity {
  pk() {
    return this.id;
  }

  static schema = {
    updatedAt: Date,
  };
}

const lastUpdated = new restHooks.Endpoint(mockLastUpdated, {
  schema: TimedEntity,
});

function CurrentTime() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const intervalID = setInterval(() => setTime(new Date()));
    return () => clearInterval(intervalID);
  }, []);
  return (
    <time>
      {Intl.DateTimeFormat('en-US', { timeStyle: 'long' }).format(time)}
    </time>
  );
}

function ResetableErrorBoundary({ children }) {
  const [i, setI] = React.useState(0);
  const { resetEntireStore } = restHooks.useController();

  return (
    <restHooks.NetworkErrorBoundary
      key={i}
      fallbackComponent={({ error }) => (
        <>
          <div>
            {error.message} <i>{error.status}</i>
          </div>
          <button
            onClick={() => {
              resetEntireStore();
              setI(i => i + 1);
            }}
          >
            Clear Error
          </button>
        </>
      )}
    >
      {children}
    </restHooks.NetworkErrorBoundary>
  );
}

class TodoResource extends BaseTodoResource {
  static list() {
    const superEndpoint = super.list();
    return superEndpoint.extend({
      async fetch(...args) {
        return (await superEndpoint(...args)).slice(0, 5);
      },
    });
  }
}

const scope = {
  ...restHooks,
  ...rest,
  ...graphql,
  mockFetch,
  BigNumber,
  lastUpdated,
  TimedEntity,
  CurrentTime,
  ResetableErrorBoundary,
  TodoResource,
};

const HooksPlayground = ({
  children,
  groupId,
  hidden = false,
  defaultOpen = false,
  row = false,
}) => (
  <Playground
    scope={scope}
    noInline
    groupId={groupId}
    defaultOpen={defaultOpen}
    row={row}
    hidden={hidden}
  >
    {typeof children === 'string'
      ? children
      : children.props.children.props.children}
  </Playground>
);
export default memo(HooksPlayground);
