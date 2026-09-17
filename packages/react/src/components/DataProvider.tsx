'use client';
import { createReducer } from '@data-client/core';
import type { State, Manager, GCInterface } from '@data-client/core';
import { Controller as DataController } from '@data-client/core';
import React from 'react';
import type { JSX } from 'react';

import DataProviderBase from './DataProviderBase.js';
import type { DevToolsPosition } from './DevToolsButton.js';
import { SSR } from './LegacyReact.js';

export interface ProviderProps {
  children: React.ReactNode;
  /**
   * Function creating the Managers for this store; called once when the
   * provider mounts. Passing instances directly is transitional and will be
   * removed in a future release.
   * @see https://dataclient.io/docs/api/DataProvider#managers
   */
  managers?: Manager[] | (() => Manager[]);
  initialState?: State<unknown>;
  Controller?: typeof DataController;
  gcPolicy?: GCInterface;
  devButton?: DevToolsPosition | null | undefined;
}

/**
 * Manages state, providing all context needed to use the hooks.
 * @see https://dataclient.io/docs/api/DataProvider
 */
export default function DataProvider(props: ProviderProps): JSX.Element {
  /* istanbul ignore else */
  if (process.env.NODE_ENV !== 'production' && SSR) {
    console.warn(
      `DataProvider from @data-client/react does not update while doing SSR.
See https://dataclient.io/docs/guides/ssr.`,
    );
  }
  return <DataProviderBase {...props} reducerFactory={createReducer} />;
}
