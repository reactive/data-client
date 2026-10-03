import type {
  CandidateKind,
  Control,
  GCScenarioConfig,
  Pattern,
} from './types';
import { scenarioId as sharedScenarioId } from '../../gc-shared/protocol.js';

export { splitMixedCount } from '../../gc-shared/protocol.js';

export interface ScenarioAxes {
  platform: 'android';
  candidateKind: CandidateKind;
  pattern: Pattern;
  count: number;
  mode: 'interaction';
  control: Control;
}

/**
 * Stable scenario ID: `android/{kind}/{pattern}/{count}/interaction/{control}`.
 * Throws on invalid axes. Listing/filtering lives in the shared protocol
 * (`examples/gc-shared/protocol-cli.js list android`, used by run-matrix.sh).
 */
export function scenarioId(axes: ScenarioAxes | GCScenarioConfig): string {
  return sharedScenarioId({
    platform: 'android',
    candidateKind: axes.candidateKind,
    pattern: axes.pattern,
    count: axes.count,
    mode: 'interaction',
    control: axes.control,
  });
}
