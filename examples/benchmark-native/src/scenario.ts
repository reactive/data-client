import type {
  CandidateKind,
  Control,
  GCScenarioConfig,
  Pattern,
} from './types';
import { CANONICAL_COUNTS } from './types';
import { validateScenarioConfig } from './validateConfig';

export interface ScenarioAxes {
  platform: 'android';
  candidateKind: CandidateKind;
  pattern: Pattern;
  count: number;
  mode: 'interaction';
  control: Control;
}

/** Stable scenario ID: `android/{kind}/{pattern}/{count}/interaction/{control}`. */
export function scenarioId(axes: ScenarioAxes | GCScenarioConfig): string {
  return [
    'android',
    axes.candidateKind,
    axes.pattern,
    String(axes.count),
    'interaction',
    axes.control,
  ].join('/');
}

/**
 * Split mixed total into entity + endpoint counts (entities get the remainder
 * when odd so entityCount + endpointCount === total).
 */
export function splitMixedCount(total: number): {
  entities: number;
  endpoints: number;
} {
  const endpoints = Math.floor(total / 2);
  return { entities: total - endpoints, endpoints };
}

export function parseScenarioId(id: string): ScenarioAxes {
  const parts = id.split('/');
  if (
    parts.length !== 6 ||
    parts[0] !== 'android' ||
    parts[4] !== 'interaction'
  ) {
    throw new Error(`invalid android scenario id: ${id}`);
  }
  const config: GCScenarioConfig = {
    candidateKind: parts[1] as CandidateKind,
    pattern: parts[2] as Pattern,
    count: Number(parts[3]),
    control: parts[5] as Control,
  };
  validateScenarioConfig(config);
  return {
    platform: 'android',
    ...config,
    mode: 'interaction',
  };
}

export function listScenarios(filter?: string): ScenarioAxes[] {
  const kinds: CandidateKind[] = ['entity', 'endpoint', 'mixed'];
  const controls: Control[] = ['gc', 'no-gc'];
  const out: ScenarioAxes[] = [];

  for (const candidateKind of kinds) {
    for (const count of CANONICAL_COUNTS) {
      for (const control of controls) {
        out.push({
          platform: 'android',
          candidateKind,
          pattern: 'unique',
          count,
          mode: 'interaction',
          control,
        });
      }
    }
  }

  for (const count of CANONICAL_COUNTS) {
    for (const control of controls) {
      out.push({
        platform: 'android',
        candidateKind: 'entity',
        pattern: 'duplicate',
        count,
        mode: 'interaction',
        control,
      });
    }
  }

  if (!filter) return out;
  const prefix = filter.startsWith('^');
  const needle = prefix ? filter.slice(1) : filter;
  return out.filter(s => {
    const id = scenarioId(s);
    return prefix ? id.startsWith(needle) : id.includes(needle);
  });
}
