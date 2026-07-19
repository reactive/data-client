import { NativeModules, Platform } from 'react-native';

import type { UiCaptureSource } from './types';

export interface MemorySnapshot {
  totalPssKb: number;
  totalPrivateDirtyKb?: number;
  rssKb?: number;
}

export interface UiFrameCaptureResult {
  source: UiCaptureSource;
  frameCount: number;
  maxFrameDurationMs: number;
  totalFrameDurationMs: number;
  missedFrames: number;
  refreshPeriodMs: number;
  refreshRateHz: number;
  wasCapturing?: boolean;
}

export interface NativeEnvironment {
  apiLevel: number;
  release: string;
  manufacturer: string;
  model: string;
  device: string;
  brand: string;
  buildType: string;
  applicationId: string;
  hermesEnabled: boolean;
  hermesRuntimeProperties?: Record<string, string>;
  refreshRateHz: number;
  refreshPeriodMs: number;
}

export interface NativeLaunchConfig {
  autoRun: boolean;
  candidateKind?: string;
  pattern?: string;
  count?: number;
  control?: string;
  samples?: number;
  label?: string;
}

interface BenchNativeNativeModule {
  getLaunchConfig(): Promise<NativeLaunchConfig>;
  getBuildManifest(): Promise<{ json: string }>;
  getEnvironment(): Promise<NativeEnvironment>;
  getMemorySnapshot(): Promise<MemorySnapshot>;
  startUiFrameCapture(): Promise<{ started: boolean; source: string }>;
  stopUiFrameCapture(): Promise<UiFrameCaptureResult>;
  writeReport(json: string): Promise<{ path: string }>;
}

const LINKING_ERROR = `BenchNative native module is not linked. Rebuild the Android app.`;

const BenchNative: BenchNativeNativeModule =
  Platform.OS === 'android' && NativeModules.BenchNative != null
    ? NativeModules.BenchNative
    : new Proxy({} as BenchNativeNativeModule, {
        get() {
          throw new Error(LINKING_ERROR);
        },
      });

export default BenchNative;

/** Optional JS heap when Hermes/RN exposes performance.memory. */
export function readJsHeapBytes(): number | undefined {
  if (typeof performance === 'undefined') return undefined;
  const mem = performance.memory;
  if (mem == null) return undefined;
  const used = mem.usedJSHeapSize;
  return typeof used === 'number' && Number.isFinite(used) ? used : undefined;
}
