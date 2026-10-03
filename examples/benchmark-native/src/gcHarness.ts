/**
 * Isolated Android GC harness — independent of DataProvider.
 *
 * Builds a benchmark-only Controller + createReducer + timerless GCPolicy with
 * raw deterministic state, queues via createCountRef, mode=end-to-end.
 * Setup/queue outside timing. Fixture shared with the Node/browser harnesses
 * (examples/gc-shared).
 */
import {
  Controller,
  GCPolicy,
  actionTypes,
  createReducer,
  initialState,
} from '@data-client/core';

import type { GCAndroidMeasurement, GCScenarioConfig } from './types';
import { createGCFixture } from '../../gc-shared/gc-fixture.js';
import type { Harness } from '../../gc-shared/gc-fixture.js';

export type { ExpectedScalars, Harness } from '../../gc-shared/gc-fixture.js';

const fixture = createGCFixture({
  GCPolicy,
  Controller,
  createReducer,
  initialState,
  GC: actionTypes.GC,
});

export const { ENTITY_KEY, ZERO_META, countRemaining, GC } = fixture;

/** End-to-end harness: sweep dispatches and reduces synchronously. */
export function createHarness(config: GCScenarioConfig): Harness {
  return fixture.createHarness(config, 'end-to-end');
}

/** Throws when an accepted sample disagrees with fixture expectations. */
export function validateMeasurement(
  config: GCScenarioConfig,
  harness: Harness,
  sample: Pick<
    GCAndroidMeasurement,
    | 'actionCount'
    | 'deletionCount'
    | 'queueEntries'
    | 'uniqueTargets'
    | 'actionTargetCount'
  >,
): void {
  fixture.validateSample(config, harness, sample, 'end-to-end', config.control);
}
