import { __INTERNAL__, legacyActions } from '@data-client/core';

export { createReducer, applyManager } from '@data-client/core';

export { default as useCacheState } from './hooks/useCacheState.js';

/** @deprecated use Controller.dispatch */
export const createFetch = legacyActions.createFetch;
/** @deprecated use Controller.dispatch */
export const createReceive = legacyActions.createReceive;
/** @deprecated use Controller.dispatch */
export const createReceiveError = legacyActions.createReceiveError;
export const initialState = __INTERNAL__.initialState;
export const DELETED = __INTERNAL__.DELETED;
export const inferResults = __INTERNAL__.inferResults;
