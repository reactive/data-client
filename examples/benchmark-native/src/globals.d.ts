/** React Native / Hermes globals used by the benchmark harness. */
interface PerformanceMemory {
  usedJSHeapSize?: number;
}

interface BenchPerformance {
  now(): number;
  memory?: PerformanceMemory;
}

declare const performance: BenchPerformance;

declare namespace NodeJS {
  interface Global {
    performance: BenchPerformance;
  }
}
