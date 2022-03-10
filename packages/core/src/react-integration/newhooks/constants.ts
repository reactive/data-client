import { ExpiryStatus } from '@rest-hooks/endpoint';

export const nullResponse = {
  data: undefined as any,
  expiryStatus: ExpiryStatus.Invalid,
  expiresAt: 0,
};
