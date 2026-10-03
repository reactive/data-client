export type Platform = 'node' | 'browser' | 'android';
export type CandidateKind = 'entity' | 'endpoint' | 'mixed';
export type Pattern = 'unique' | 'duplicate';
export type Control = 'gc' | 'no-gc';
export type Mode = 'scan' | 'reducer' | 'end-to-end' | 'interaction';

export interface ScenarioAxesInput {
  candidateKind: CandidateKind;
  pattern: Pattern;
  count: number;
  control: Control;
}

export interface ScenarioAxes extends ScenarioAxesInput {
  platform: Platform;
  mode: Mode;
}

export interface ScenarioDescriptor extends ScenarioAxes {
  id: string;
}

/** Field names in validation messages, plus the prefix before allowed values. */
export type AxisLabels = Record<
  'candidateKind' | 'pattern' | 'count' | 'control' | 'samples' | 'oneOf',
  string
>;

export declare const CANONICAL_COUNTS: readonly [1000, 10000, 100000];
export declare const CANDIDATE_KINDS: readonly CandidateKind[];
export declare const PATTERNS: readonly Pattern[];
export declare const CONTROLS: readonly Control[];
export declare const MODES_BY_PLATFORM: {
  readonly node: readonly ['scan', 'reducer', 'end-to-end'];
  readonly browser: readonly ['end-to-end'];
  readonly android: readonly ['interaction'];
};
export declare const MAX_SAMPLES: 50;
export declare const AXIS_LABELS: AxisLabels;

/** Throws on invalid axes; does not coerce. */
export declare function validateAxes(
  axes: ScenarioAxesInput,
  labels?: AxisLabels,
): void;
export declare function validateSampleCount(
  samples: number,
  labels?: AxisLabels,
): void;
/** `{platform}/{candidateKind}/{pattern}/{count}/{mode}/{control}`; throws on invalid axes. */
export declare function scenarioId(axes: ScenarioAxes): string;
export declare function parseScenarioId(id: string): ScenarioAxes;
/** Empty → all; `^text` → prefix; otherwise slash-bounded contiguous segments. */
export declare function matchScenarioId(id: string, filter?: string): boolean;
export declare function listScenarios(
  platform: Platform,
  options?: { filter?: string },
): ScenarioDescriptor[];
export declare function splitMixedCount(total: number): {
  entities: number;
  endpoints: number;
};
