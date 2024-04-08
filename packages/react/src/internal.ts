import { __INTERNAL__ } from '@data-client/core';

export { createReducer, applyManager } from '@data-client/core';

export { default as useCacheState } from './hooks/useCacheState.js';

export const initialState = __INTERNAL__.initialState;
export const INVALID = __INTERNAL__.INVALID;
export const MemoCache = __INTERNAL__.MemoCache;
