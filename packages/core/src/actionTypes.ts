export const FETCH_TYPE = 'rdc/fetch' as const;
/** @deprecated use SET_TYPE instead */
export const RECEIVE_TYPE = 'rdc/receive' as const;
export const SET_TYPE = RECEIVE_TYPE;
export const OPTIMISTIC_TYPE = 'rdc/optimistic' as const;
export const RESET_TYPE = 'rdc/reset' as const;
export const SUBSCRIBE_TYPE = 'rdc/subscribe' as const;
export const UNSUBSCRIBE_TYPE = 'rest-hook/unsubscribe' as const;
export const INVALIDATE_TYPE = 'rdc/invalidate' as const;
export const INVALIDATEALL_TYPE = 'rdc/invalidateall' as const;
export const EXPIREALL_TYPE = 'rdc/expireall' as const;
export const GC_TYPE = 'rdc/gc' as const;
