import { LiveProvider } from 'react-live';
import React, { useEffect, useState, memo } from 'react';
import * as restHooks from 'rest-hooks';
import * as rest from '@rest-hooks/rest';
import * as hooks from '@rest-hooks/hooks';
import * as graphql from '@rest-hooks/graphql';
import BigNumber from 'bignumber.js';
import type { FixtureEndpoint } from '@rest-hooks/test';

import {
  TodoResource as BaseTodoResource,
  Todo,
  TodoEndpoint,
} from './resources/TodoResource';
import ResetableErrorBoundary from '../ResettableErrorBoundary';
import PreviewWithHeader from './PreviewWithHeader';
import transformCode from './transformCode';

function randomFloatInRange(min, max, decimals) {
  const str = (Math.random() * (max - min) + min).toFixed(decimals);

  return parseFloat(str);
}

const mockFetch = (getResponse, name, delay = 150) => {
  const fetch = (...args) =>
    new Promise(resolve =>
      setTimeout(() => resolve(getResponse(...args)), delay),
    );
  if (name)
    Object.defineProperty(fetch, 'name', { value: name, writable: false });
  return fetch;
};

const mockLastUpdated = ({ id }) => {
  return new Promise(resolve => {
    setTimeout(
      () =>
        resolve({
          id,
          updatedAt: new Date().toISOString(),
        }),
      150,
    );
  });
};
class TimedEntity extends rest.Entity {
  id = '';
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

const TodoResource = {
  ...BaseTodoResource,
  getList: BaseTodoResource.getList.extend({
    process(todos) {
      return todos.slice(0, 7);
    },
  }),
};

const scope = {
  ...restHooks,
  ...rest,
  ...graphql,
  ...hooks,
  randomFloatInRange,
  mockFetch,
  BigNumber,
  CurrentTime,
  ResetableErrorBoundary,
};
const scopeWithEndpoint = {
  ...scope,
  lastUpdated,
  TimedEntity,
  Todo,
  TodoResource,
  TodoEndpoint,
};

export default function PreviewWithScope({
  code,
  includeEndpoints,
  ...props
}: {
  code: string;
  includeEndpoints: boolean;
  groupId: string;
  defaultOpen: 'y' | 'n';
  row: boolean;
  fixtures: FixtureEndpoint[];
}) {
  return (
    <LiveProvider
      key="preview"
      code={code}
      transformCode={transformCode}
      noInline
      scope={includeEndpoints ? scopeWithEndpoint : scope}
    >
      <PreviewWithHeader key="preview" {...props} />
    </LiveProvider>
  );
}
