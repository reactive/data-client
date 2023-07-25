import * as graphql from '@data-client/graphql';
import * as hooks from '@data-client/hooks';
import * as rhReact from '@data-client/react';
import * as rest from '@data-client/rest';
import * as restNext from '@data-client/rest/next';
import type { Fixture, Interceptor } from '@data-client/test';
import BigNumber from 'bignumber.js';
import React from 'react';
import { LiveProvider } from 'react-live';
import { v4 as uuid } from 'uuid';

import * as designSystem from './DesignSystem';
import PreviewWithHeader from './PreviewWithHeader';
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

const scope = {
  ...rhReact,
  ...rest,
  ...restNext,
  ...graphql,
  ...hooks,
  uuid,
  randomFloatInRange,
  mockFetch,
  BigNumber,
  ResetableErrorBoundary,
  ...designSystem,
};

export default function PreviewWithScope<T>({
  code,
  ...props
}: {
  code: string;
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
      scope={scope}
    >
      <PreviewWithHeader key="preview" {...props} />
    </LiveProvider>
  );
}
