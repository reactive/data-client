/**
 * Provides an abstraction over react 17 and 18 compatible libraries
 */
import type { ActType, RenderHook } from './renderHookTypes.js';
import { USE18 } from './use18.cjs';

export const renderHook: RenderHook =
  USE18 ?
    require('./render18HookWrapped.js').render18Wrapper
  : (require('@testing-library/react-hooks').renderHook as any);

// this is for react native + react web compatibility, not actually 18 compatibility
export const act: ActType =
  USE18 ?
    require('./render18HookWrapped.js').act
  : (require('@testing-library/react-hooks').act as any);
