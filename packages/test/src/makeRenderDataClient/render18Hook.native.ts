/**
 * React Native Testing Library 14 made render, renderHook and act async.
 * When its renderer (test-renderer, an RNTL 14 peer) is installed, render hooks
 * with it directly so renderDataClient() stays synchronous; otherwise use
 * RNTL 13's sync APIs.
 */
import * as RNTL from '@testing-library/react-native';
import React from 'react';
import type { Root } from 'test-renderer';

import type { ActType, RenderHook } from './renderHookTypes.js';

export { waitFor } from '@testing-library/react-native';
export type { RenderHookOptions } from '@testing-library/react';

let createRoot: (() => Root) | undefined;
try {
  createRoot = require('test-renderer').createRoot;
} catch (e: any) {
  if (e?.code !== 'MODULE_NOT_FOUND') throw e;
}

/** A sync port of RNTL's render-hook.js */
function makeRenderHook(createRoot: () => Root) {
  const roots = new Set<Root>();
  if (typeof afterEach === 'function') {
    afterEach(() => {
      React.act(() => {
        for (const root of roots) root.unmount();
      });
      roots.clear();
    });
  }

  return function renderHook(
    callback: (props: any) => any,
    { initialProps, wrapper }: { initialProps?: any; wrapper?: any } = {},
  ) {
    const result = { current: undefined as any };
    function HookContainer({ hookProps }: { hookProps: any }) {
      const renderResult = callback(hookProps);
      React.useEffect(() => {
        result.current = renderResult;
      });
      return null;
    }
    const root = createRoot();
    roots.add(root);
    const render = (hookProps: any) => {
      const element = React.createElement(HookContainer, { hookProps });
      React.act(() => {
        root.render(
          wrapper ? React.createElement(wrapper, null, element) : element,
        );
      });
    };
    render(initialProps);
    return {
      result,
      rerender: render,
      unmount() {
        roots.delete(root);
        React.act(() => root.unmount());
      },
    };
  };
}

/**
 * Sync React.act() that also works inside RNTL's waitFor(), which turns off the
 * act environment. Mirrors withGlobalActEnvironment() from RNTL's act.js, whose
 * exported act() is always async.
 */
function actEnvironment(callback: () => any): any {
  const g = globalThis as any;
  const previous = g.IS_REACT_ACT_ENVIRONMENT;
  const restore = () => {
    g.IS_REACT_ACT_ENVIRONMENT = previous;
  };
  g.IS_REACT_ACT_ENVIRONMENT = true;
  let isAsync = false;
  try {
    const result = React.act(() => {
      const value = callback();
      isAsync = typeof value?.then === 'function';
      return value;
    });
    return isAsync ? Promise.resolve(result).finally(restore) : result;
  } finally {
    if (!isAsync) restore();
  }
}

export const renderHook = (
  createRoot ?
    makeRenderHook(createRoot)
  : RNTL.renderHook) as RenderHook;

export const act = (createRoot ? actEnvironment : RNTL.act) as ActType;
