import { __INTERNAL__, legacyActions } from '@rest-hooks/core';

export { createReducer, applyManager } from '@rest-hooks/core';

export { default as useCacheState } from './hooks/useCacheState.js';

export const createFetch = legacyActions.createFetch;
export const createReceive = legacyActions.createReceive;
export const createReceiveError = legacyActions.createReceiveError;
export const initialState = __INTERNAL__.initialState;
export const DELETED = __INTERNAL__.DELETED;
export const inferResults = __INTERNAL__.inferResults;
