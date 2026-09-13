/**
 * Real harness tests against createHarness / queue / reducer (not reimplemented math).
 */
import {
  countRemaining,
  createHarness,
  validateMeasurement,
  GC,
} from '../src/gcHarness';
import type { GCScenarioConfig } from '../src/types';

const SMALL = 32;

function runSweepSample(config: GCScenarioConfig) {
  const harness = createHarness(config);
  const { policy, expected } = harness;

  expect(policy.queueEntries).toBe(expected.queueEntries);
  expect(expected.uniqueTargets).toBe(
    config.pattern === 'duplicate' ? 1 : config.count,
  );

  if (config.control === 'no-gc') {
    validateMeasurement(config, harness, {
      actionCount: 0,
      deletionCount: 0,
      queueEntries: expected.queueEntries,
      uniqueTargets: expected.uniqueTargets,
      actionTargetCount: 0,
    });
    harness.dispose();
    return;
  }

  policy.sweep();
  const action = harness.getCapturedAction();
  expect(action).not.toBeNull();
  expect(action!.type).toBe(GC);
  expect(action!.entities.length).toBe(expected.expectedEntitiesInAction);
  expect(action!.endpoints.length).toBe(expected.expectedEndpointsInAction);

  if (config.pattern === 'duplicate') {
    const unique = new Set(action!.entities.map(p => `${p.key}:${p.pk}`));
    expect(unique.size).toBe(1);
  }

  const remaining = countRemaining(harness.getState(), config, expected);
  expect(remaining.entityRemaining).toBe(0);
  expect(remaining.endpointRemaining).toBe(0);
  expect(policy.queueEntries).toBe(0);

  const deletionCount = remaining.entityDeleted + remaining.endpointDeleted;
  validateMeasurement(config, harness, {
    actionCount: 1,
    deletionCount,
    queueEntries: expected.queueEntries,
    uniqueTargets: expected.uniqueTargets,
    actionTargetCount:
      expected.expectedEntitiesInAction + expected.expectedEndpointsInAction,
  });

  harness.dispose();
}

describe('createHarness end-to-end', () => {
  const uniqueKinds = ['entity', 'endpoint', 'mixed'] as const;

  for (const candidateKind of uniqueKinds) {
    for (const control of ['gc', 'no-gc'] as const) {
      it(`${candidateKind}/unique/${SMALL}/${control}`, () => {
        runSweepSample({
          candidateKind,
          pattern: 'unique',
          count: SMALL,
          control,
        });
      });
    }
  }

  for (const control of ['gc', 'no-gc'] as const) {
    it(`entity/duplicate/${SMALL}/${control}`, () => {
      runSweepSample({
        candidateKind: 'entity',
        pattern: 'duplicate',
        count: SMALL,
        control,
      });
    });
  }
});
