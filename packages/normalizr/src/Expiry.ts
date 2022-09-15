export const enum ExpiryStatus {
  Invalid = 1,
  InvalidIfStale,
  Valid,
}
// looser version to allow for cross-package version compatibility
export type ExpiryStatusInterface = 1 | 2 | 3;
