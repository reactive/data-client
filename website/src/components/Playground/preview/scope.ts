import * as graphql from '@data-client/graphql';
import * as rhReact from '@data-client/react';
import * as rhReactNext from '@data-client/react/next';
import * as rest from '@data-client/rest';
import BigNumber from 'bignumber.js';
import { use } from 'react';
import { v4 as uuid } from 'uuid';

import ResetableErrorBoundary from '../../ResettableErrorBoundary';
import * as designSystem from '../DesignSystem';
import { Temporal, Intl, DateTimeFormat } from '../temporal';

function randomFloatInRange(min: number, max: number, decimals: number) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function mockFetch(
  getResponse: (...args: any[]) => unknown,
  name?: string,
  delay = 150,
) {
  const fetch = (...args: any[]) =>
    new Promise(resolve =>
      setTimeout(() => resolve(getResponse(...args)), delay),
    );
  if (name)
    Object.defineProperty(fetch, 'name', { value: name, writable: false });
  return fetch;
}

export const previewScope = {
  ...rhReact,
  ...rhReactNext,
  ...graphql,
  ...rest,
  use,
  uuid,
  randomFloatInRange,
  mockFetch,
  BigNumber,
  ResetableErrorBoundary,
  Temporal,
  Intl,
  DateTimeFormat,
  ...designSystem,
};
