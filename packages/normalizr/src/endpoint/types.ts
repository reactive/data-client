export type FetchFunction<A extends readonly any[] = any, R = any> = (
  ...args: A
) => Promise<R>;

export * from './ErrorTypes.js';
export * from './utility.js';
export * from './IndexInterface.js';
export * from './EndpointInterface.js';
export * from './SnapshotInterface.js';
