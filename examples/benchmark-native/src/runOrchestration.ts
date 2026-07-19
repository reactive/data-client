/**
 * Shared measurement orchestration for manual Run and intent auto-run.
 */
import BenchNative from './BenchNative';
import { disposeGCScenario, prepareGCScenario, runGCScenario } from './measure';
import { buildMeasurementReport } from './report';
import { scenarioId } from './scenario';
import type {
  AndroidEnvironment,
  BuildManifestV1,
  GCAndroidMeasurement,
  GCMeasurementReport,
  GCScenarioConfig,
} from './types';
import { validateSampleCount, validateScenarioConfig } from './validateConfig';

export interface ExecuteMeasurementArgs {
  config: GCScenarioConfig;
  samples: number;
  label?: string;
  onStatus?: (message: string) => void;
}

export interface ExecuteMeasurementResult {
  report: GCMeasurementReport;
  path: string;
  scenarioId: string;
  samples: GCAndroidMeasurement[];
}

async function readEnvironment(): Promise<AndroidEnvironment> {
  const envRaw = await BenchNative.getEnvironment();
  return { platform: 'android', ...envRaw };
}

export async function readEmbeddedBuildManifest(): Promise<BuildManifestV1> {
  const raw = await BenchNative.getBuildManifest();
  const text = raw.json;
  if (!text) {
    throw new Error('embedded build-manifest.json empty');
  }
  const parsed = JSON.parse(text) as BuildManifestV1;
  if (parsed.schemaVersion !== 1 || !parsed.buildId || !parsed.sourceDigest) {
    throw new Error('invalid embedded BuildManifest v1');
  }
  return parsed;
}

export async function executeMeasurement(
  args: ExecuteMeasurementArgs,
): Promise<ExecuteMeasurementResult> {
  validateScenarioConfig(args.config);
  validateSampleCount(args.samples);

  const id = scenarioId(args.config);
  args.onStatus?.(`Running ${id}…`);

  const environment = await readEnvironment();
  const manifest = await readEmbeddedBuildManifest();
  const collected: GCAndroidMeasurement[] = [];

  try {
    for (let i = 0; i < args.samples; i++) {
      args.onStatus?.(`Sample ${i + 1}/${args.samples}: prepare…`);
      await prepareGCScenario(args.config);
      // Let the React status commit paint before capture so it does not
      // contaminate UI frame / interaction measurement (outside timing).
      args.onStatus?.(`Sample ${i + 1}/${args.samples}: measure…`);
      await new Promise<void>(resolve => {
        requestAnimationFrame(() => resolve());
      });
      collected.push(await runGCScenario());
      disposeGCScenario();
    }

    const report = buildMeasurementReport({
      environment,
      config: args.config,
      samples: collected,
      manifest,
      label: args.label,
    });

    const { path } = await BenchNative.writeReport(JSON.stringify(report));
    args.onStatus?.(
      `Done — wrote ${path} (buildId=${manifest.buildId.slice(0, 8)}… totalMs median≈${report.scenarios[0].summary.totalMs?.median?.toFixed?.(2) ?? 'n/a'})`,
    );

    return { report, path, scenarioId: id, samples: collected };
  } catch (e) {
    disposeGCScenario();
    throw e;
  }
}
