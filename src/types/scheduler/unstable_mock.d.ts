/* eslint @typescript-eslint/camelcase: 0 */
export * from '../scheduler';
export function unstable_flushAllWithoutAsserting(): void;
export function unstable_flushNumberOfYields(): void;
export function unstable_flushExpired(): void;
export function unstable_clearYields(): void;
export function unstable_flushUntilNextPaint(): void;
export function unstable_flushAll(): void;
export function unstable_yieldValue(): void;
export function unstable_advanceTime(ms: number): void;
