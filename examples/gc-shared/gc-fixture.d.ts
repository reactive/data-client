import type * as Core from '@data-client/core';

import type { CandidateKind, Control, Pattern } from './protocol.js';

/** Named pieces of one `@data-client/core` build (Node passes its dist bundle). */
export interface CoreDeps {
  GCPolicy: typeof Core.GCPolicy;
  Controller: typeof Core.Controller;
  createReducer: typeof Core.createReducer;
  initialState: Core.State<unknown>;
  GC: string;
}

export type HarnessMode = 'scan' | 'reducer' | 'end-to-end';

export interface FixtureSpec {
  candidateKind: CandidateKind;
  pattern: Pattern;
  count: number;
}

export interface EntityPath {
  key: string;
  pk: string;
}

export interface GCAction {
  type: string;
  entities: EntityPath[];
  endpoints: string[];
}

export interface ExpectedScalars {
  queueEntries: number;
  uniqueTargets: number;
  expectedEntitiesInAction: number;
  expectedEndpointsInAction: number;
  expectedUniqueEntityDeletions: number;
  expectedEndpointDeletions: number;
}

/** Timerless policy with a public one-shot sweep (calls protected runSweep). */
export type BenchmarkGCPolicy = Core.GCPolicy & {
  sweep(): void;
  readonly entityQueueLength: number;
  readonly endpointQueueSize: number;
  readonly queueEntries: number;
};

export interface Harness {
  policy: BenchmarkGCPolicy;
  reducer: (state: Core.State<unknown>, action: any) => Core.State<unknown>;
  expected: ExpectedScalars;
  /** Reducer mode only; null otherwise or after releaseObserverRefs(). */
  readonly prebuiltAction: GCAction | null;
  getState(): Core.State<unknown>;
  getCapturedAction(): GCAction | null;
  clearCapturedAction(): void;
  /** Drop captured/prebuilt action and seed; keep the live store. */
  releaseObserverRefs(): void;
  /** Reducer mode: hand the seed state to the caller and drop the seed ref. */
  takeReducerState(): Core.State<unknown>;
  dispose(): void;
}

export interface SampleCounts {
  actionCount: number;
  deletionCount: number;
  queueEntries: number;
  uniqueTargets: number;
  actionTargetCount: number;
}

export interface Remaining {
  entityDeleted: number;
  endpointDeleted: number;
  entityRemaining: number;
  endpointRemaining: number;
}

export declare const ENTITY_KEY: 'BenchEntity';
export declare const ZERO_META: Readonly<{
  date: 0;
  fetchedAt: 0;
  expiresAt: 0;
}>;
export declare function queueCandidates(
  policy: Core.GCPolicy,
  spec: FixtureSpec,
): ExpectedScalars;
export declare function countRemaining(
  state: Core.State<unknown>,
  spec: FixtureSpec,
  expected: ExpectedScalars,
): Remaining;

export interface GCFixture {
  ENTITY_KEY: typeof ENTITY_KEY;
  ZERO_META: typeof ZERO_META;
  BenchmarkGCPolicy: new () => BenchmarkGCPolicy;
  buildEntityState(count: number): Core.State<unknown>;
  buildEndpointState(count: number): Core.State<unknown>;
  buildMixedState(
    entityCount: number,
    endpointCount: number,
  ): Core.State<unknown>;
  buildStateForSpec(spec: FixtureSpec): Core.State<unknown>;
  queueCandidates: typeof queueCandidates;
  buildPrebuiltAction(spec: FixtureSpec): GCAction;
  createHarness(spec: FixtureSpec, mode: HarnessMode): Harness;
  countRemaining: typeof countRemaining;
  /** Throws when a sample disagrees with fixture expectations. */
  validateSample(
    spec: FixtureSpec,
    harness: Harness,
    sample: SampleCounts,
    mode: HarnessMode,
    control: Control,
  ): void;
  GC: string;
}

export declare function createGCFixture(core: CoreDeps): GCFixture;
