/* eslint @typescript-eslint/camelcase: 0 */
export const unstable_IdlePriority: number;
export const unstable_ImmediatePriority: number;
export const unstable_LowPriority: number;
export const unstable_NormalPriority: number;
export const unstable_UserBlockingPriority: number;
export function unstable_cancelCallback(callbackNode: any): void;
export function unstable_continueExecution(): void;
export function unstable_getCurrentPriorityLevel(): any;
export function unstable_getFirstCallbackNode(): any;
export function unstable_next(eventHandler: any): any;
export function unstable_now(): any;
export function unstable_pauseExecution(): void;
export function unstable_runWithPriority(priorityLevel: any, eventHandler: any): any;
export function unstable_scheduleCallback( callback: any, deprecated_options: any): any;
export function unstable_shouldYield(): any;
export function unstable_wrapCallback(callback: any): any;
