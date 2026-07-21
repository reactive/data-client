import {
  ConfigValidationError,
  MAX_SAMPLES,
  parseHostEnvConfig,
  parseLaunchConfig,
  validateSampleCount,
  validateScenarioConfig,
} from '../src/validateConfig';

describe('validateScenarioConfig', () => {
  it('accepts canonical axes', () => {
    expect(() =>
      validateScenarioConfig({
        candidateKind: 'mixed',
        pattern: 'unique',
        count: 100000,
        control: 'no-gc',
      }),
    ).not.toThrow();
  });

  it('rejects non-canonical counts', () => {
    expect(() =>
      validateScenarioConfig({
        candidateKind: 'entity',
        pattern: 'unique',
        count: 500,
        control: 'gc',
      }),
    ).toThrow(ConfigValidationError);
  });

  it('rejects duplicate with non-entity', () => {
    expect(() =>
      validateScenarioConfig({
        candidateKind: 'endpoint',
        pattern: 'duplicate',
        count: 1000,
        control: 'gc',
      }),
    ).toThrow(/duplicate pattern only supports/);
  });

  it('rejects invalid enums', () => {
    expect(() =>
      validateScenarioConfig({
        candidateKind: 'widget' as any,
        pattern: 'unique',
        count: 1000,
        control: 'gc',
      }),
    ).toThrow(/candidateKind/);
    expect(() =>
      validateScenarioConfig({
        candidateKind: 'entity',
        pattern: 'unique',
        count: 1000,
        control: 'maybe' as any,
      }),
    ).toThrow(/control/);
  });
});

describe('validateSampleCount', () => {
  it('accepts 1..MAX_SAMPLES', () => {
    expect(() => validateSampleCount(1)).not.toThrow();
    expect(() => validateSampleCount(MAX_SAMPLES)).not.toThrow();
  });

  it('rejects 0, negative, and oversized', () => {
    expect(() => validateSampleCount(0)).toThrow(ConfigValidationError);
    expect(() => validateSampleCount(-1)).toThrow(ConfigValidationError);
    expect(() => validateSampleCount(MAX_SAMPLES + 1)).toThrow(
      ConfigValidationError,
    );
  });
});

describe('parseLaunchConfig', () => {
  it('applies defaults then validates', () => {
    const parsed = parseLaunchConfig({ autoRun: true });
    expect(parsed).toMatchObject({
      autoRun: true,
      candidateKind: 'entity',
      pattern: 'unique',
      count: 1000,
      control: 'gc',
      samples: 1,
    });
    expect(parsed.label).toBeUndefined();
  });

  it('accepts optional label without commit authority', () => {
    const parsed = parseLaunchConfig({
      autoRun: false,
      label: 'baseline',
      count: 1000,
    });
    expect(parsed.label).toBe('baseline');
    expect((parsed as { commit?: string }).commit).toBeUndefined();
  });

  it('fails clearly on invalid intent-like input', () => {
    expect(() => parseLaunchConfig({ autoRun: true, count: 999 })).toThrow(
      /invalid count/,
    );
    expect(() =>
      parseLaunchConfig({
        autoRun: true,
        candidateKind: 'endpoint',
        pattern: 'duplicate',
        count: 1000,
      }),
    ).toThrow(/duplicate/);
    expect(() => parseLaunchConfig({ autoRun: true, samples: 0 })).toThrow(
      /samples/,
    );
  });
});

describe('parseHostEnvConfig', () => {
  it('parses shell-like strings', () => {
    expect(
      parseHostEnvConfig({
        candidateKind: 'entity',
        pattern: 'duplicate',
        count: '100000',
        control: 'gc',
        samples: '5',
      }),
    ).toEqual({
      candidateKind: 'entity',
      pattern: 'duplicate',
      count: 100000,
      control: 'gc',
      samples: 5,
    });
  });
});
