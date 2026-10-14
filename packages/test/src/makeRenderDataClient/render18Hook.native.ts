/**
 * React Native Testing Library 14 made render, renderHook and act async.
 * When its renderer (test-renderer) is installed, render hooks with it directly
 * so renderDataClient() stays synchronous; otherwise use RNTL 13's sync APIs.
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

const roots = new Set<Root>();
if (createRoot && typeof afterEach === 'function') {
  afterEach(() => {
    for (const root of roots) React.act(() => root.unmount());
    roots.clear();
  });
}

function renderTestRendererHook(
  callback: (props: any) => any,
  { initialProps, wrapper }: { initialProps?: any; wrapper?: any } = {},
) {
  const result = React.createRef<any>();
  function HookContainer({ hookProps }: { hookProps: any }) {
    const renderResult = callback(hookProps);
    React.useEffect(() => {
      (result as any).current = renderResult;
    });
    return null;
  }
  const root = (createRoot as () => Root)();
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
}

export const renderHook: RenderHook =
  createRoot ? (renderTestRendererHook as any) : (RNTL.renderHook as any);

/** React.act() that also works inside RNTL's waitFor(), which turns off the act environment */
function actEnvironment(callback: () => any): any {
  const g = globalThis as any;
  const previous = g.IS_REACT_ACT_ENVIRONMENT;
  g.IS_REACT_ACT_ENVIRONMENT = true;
  let isAsync = false;
  let result: any;
  try {
    result = React.act(() => {
      const value = callback();
      isAsync = typeof value?.then === 'function';
      return value;
    });
  } catch (e) {
    g.IS_REACT_ACT_ENVIRONMENT = previous;
    throw e;
  }
  if (!isAsync) {
    g.IS_REACT_ACT_ENVIRONMENT = previous;
    return result;
  }
  return Promise.resolve(result).finally(() => {
    g.IS_REACT_ACT_ENVIRONMENT = previous;
  });
}

export const act: ActType = createRoot ? actEnvironment : (RNTL.act as any);
