import * as graphql from '@data-client/graphql';
import * as rhReact from '@data-client/react';
import * as rhReactNext from '@data-client/react/next';
import * as rest from '@data-client/rest';
import BigNumber from 'bignumber.js';
import qs from 'qs';
import { Suspense, use } from 'react';
// uses native Temporal (and its Intl) when the browser has it
import { Temporal, Intl } from 'temporal-polyfill';
import { v4 as uuid } from 'uuid';

import * as designSystem from '../DesignSystem';
import { Link, ROUTER, Router, useNavigate } from './router';
import { withHookNames } from './store/callSite';

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

// every hook is named while it runs, so the Store inspector can credit
// the ones that dispatch (a fetch, a subscribe)
export const previewScope = {
  ...withHookNames({ ...rhReact, ...rhReactNext }),
  ...graphql,
  ...rest,
  use,
  Suspense,
  uuid,
  qs,
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
