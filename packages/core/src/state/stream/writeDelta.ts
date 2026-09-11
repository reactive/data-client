import type { StateBaseline, StateDelta } from './types.js';
import type { State } from '../../types.js';
import { initialState } from '../reducer/initialState.js';

type Writable<T> = { -readonly [K in keyof T]: T[K] };
type Table<T> = { [key: string]: T };

/** Assigning these as own keys of a plain object would alter its prototype chain */
export function isUnsafeKey(key: string): boolean {
  return key === '__proto__' || key === 'constructor' || key === 'prototype';
}

/**
 * Copy-on-write application of `delta` to `state`.
 *
 * With a `baseline`, slots the client has changed since that baseline are
 * left alone (three-way merge). Without one every change is taken.
 */
export function writeDelta(
  state: State<unknown>,
  delta: StateDelta,
  baseline?: StateBaseline,
): State<unknown> {
  if (delta.reset !== undefined) {
    state = { ...initialState, lastReset: delta.reset };
    baseline = undefined;
  }
  const next: Writable<State<unknown>> = { ...state };
  const copiedEntityTables = new Set<string>();
  const copiedIndexTables = new Set<string>();
  let changed = delta.reset !== undefined;

  for (const { key, pk, value } of delta.entities) {
    if (isUnsafeKey(key) || isUnsafeKey(pk)) continue;
    if (
      baseline &&
      (state.entities[key]?.[pk] !== baseline.entities[key]?.[pk] ||
        state.entitiesMeta[key]?.[pk] !== baseline.entitiesMeta[key]?.[pk])
    )
      continue;
    changed = true;
    if (!copiedEntityTables.has(key)) {
      if (copiedEntityTables.size === 0) {
        next.entities = { ...state.entities };
        next.entitiesMeta = { ...state.entitiesMeta };
      }
      copiedEntityTables.add(key);
      (next.entities as Table<any>)[key] = { ...state.entities[key] };
      (next.entitiesMeta as Table<any>)[key] = { ...state.entitiesMeta[key] };
    }
    const entities = (next.entities as Table<any>)[key];
    const entitiesMeta = (next.entitiesMeta as Table<any>)[key];
    if (value?.entity !== undefined) entities[pk] = value.entity;
    else delete entities[pk];
    if (value?.meta !== undefined) entitiesMeta[pk] = value.meta;
    else delete entitiesMeta[pk];
  }

  let copiedEndpoints = false;
  for (const { key, value } of delta.endpoints) {
    if (isUnsafeKey(key)) continue;
    if (
      baseline &&
      (state.endpoints[key] !== baseline.endpoints[key] ||
        state.meta[key] !== baseline.meta[key])
    )
      continue;
    changed = true;
    if (!copiedEndpoints) {
      copiedEndpoints = true;
      next.endpoints = { ...state.endpoints };
      next.meta = { ...state.meta };
    }
    if (value?.endpoint !== undefined)
      (next.endpoints as Table<any>)[key] = value.endpoint;
    else delete (next.endpoints as Table<any>)[key];
    if (value?.meta !== undefined) (next.meta as Table<any>)[key] = value.meta;
    else delete (next.meta as Table<any>)[key];
  }

  for (const { key, index, value } of delta.indexes) {
    if (isUnsafeKey(key) || isUnsafeKey(index)) continue;
    if (
      baseline &&
      state.indexes[key]?.[index] !== baseline.indexes[key]?.[index]
    )
      continue;
    changed = true;
    if (!copiedIndexTables.has(key)) {
      if (copiedIndexTables.size === 0) next.indexes = { ...state.indexes };
      copiedIndexTables.add(key);
      (next.indexes as Table<any>)[key] = { ...state.indexes[key] };
    }
    const table = (next.indexes as Table<any>)[key];
    if (value !== undefined) table[index] = value;
    else delete table[index];
  }

  return changed ? next : state;
}
