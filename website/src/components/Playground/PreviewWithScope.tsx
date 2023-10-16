import * as graphql from '@rest-hooks/graphql';
import * as hooks from '@rest-hooks/hooks';
import * as rhReact from '@rest-hooks/react';
import * as rhReactNext from '@rest-hooks/react/next';
import * as rest from '@rest-hooks/rest';
import * as restNext from '@rest-hooks/rest/next';
import type { Fixture, Interceptor } from '@rest-hooks/test';
import BigNumber from 'bignumber.js';
import React from 'react';
import { LiveProvider } from 'react-live';

import * as designSystem from './DesignSystem';
import PreviewWithHeader from './PreviewWithHeader';
import {
  TodoResource as BaseTodoResource,
  Todo,
  TodoEndpoint,
} from './resources/TodoResource';
import transformCode from './transformCode';
import ResetableErrorBoundary from '../ResettableErrorBoundary';

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

const lastUpdated = new rest.Endpoint(mockLastUpdated, {
  schema: TimedEntity,
});

const TodoResource = {
  ...BaseTodoResource,
  getList: BaseTodoResource.getList.extend({
    process(todos) {
      return todos.slice(0, 7);
    },
  }),
};

const scope = {
  ...rhReact,
  ...rest,
  ...graphql,
  ...hooks,
  randomFloatInRange,
  mockFetch,
  BigNumber,
  ResetableErrorBoundary,
  ...designSystem,
};
const scopeWithNext = {
  ...scope,
  ...restNext,
  ...rhReactNext,
};
const scopeWithEndpoint = {
  ...scope,
  lastUpdated,
  TimedEntity,
  Todo,
  TodoResource,
  TodoEndpoint,
};

export default function PreviewWithScope<T>({
  code,
  includeEndpoints,
  next,
  ...props
}: {
  code: string;
  next: boolean;
  includeEndpoints: boolean;
  groupId: string;
  defaultOpen: 'y' | 'n';
  row: boolean;
  fixtures: (Fixture | Interceptor<T>)[];
  getInitialInterceptorData?: () => T;
}) {
  return (
    <LiveProvider
      key="preview"
      code={code}
      transformCode={transformCode}
      enableTypeScript={true}
      noInline
      scope={
        next ? scopeWithNext : includeEndpoints ? scopeWithEndpoint : scope
      }
    >
      <PreviewWithHeader key="preview" {...props} />
    </LiveProvider>
  );
}
