import * as graphql from '@data-client/graphql';
import * as rhReact from '@data-client/react';
import * as rhReactNext from '@data-client/react/next';
import * as rest from '@data-client/rest';
import BigNumber from 'bignumber.js';
import { Suspense, use } from 'react';
import { Temporal, Intl } from 'temporal-polyfill';
import { v4 as uuid } from 'uuid';

import * as designSystem from '../DesignSystem';
import { Link, ROUTER, Router, useNavigate } from './router';

function randomFloatInRange(min: number, max: number, decimals: number) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function mockFetch<T>(
  getResponse: (...args: any[]) => T,
  name?: string,
  delay = 150,
) {
  const fetch = (...args: any[]) =>
    new Promise<T>(resolve =>
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
  Suspense,
  uuid,
  randomFloatInRange,
  mockFetch,
  BigNumber,
  Temporal,
  Intl,
  DateTimeFormat: Intl.DateTimeFormat,
  ...designSystem,
  Link,
  useNavigate,
  [ROUTER]: Router,
};
