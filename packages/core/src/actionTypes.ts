export const FETCH_TYPE = 'rest-hooks/fetch' as const;
/** @deprecated use SET_TYPE instead */
export const RECEIVE_TYPE = 'rest-hooks/receive' as const;
export const SET_TYPE = RECEIVE_TYPE;
export const OPTIMISTIC_TYPE = 'rest-hooks/optimistic' as const;
export const RESET_TYPE = 'rest-hooks/reset' as const;
export const SUBSCRIBE_TYPE = 'rest-hooks/subscribe' as const;
export const UNSUBSCRIBE_TYPE = 'rest-hook/unsubscribe' as const;
export const INVALIDATE_TYPE = 'rest-hooks/invalidate' as const;
export const INVALIDATEALL_TYPE = 'rest-hooks/invalidateall' as const;
export const EXPIREALL_TYPE = 'rest-hooks/expireall' as const;
export const GC_TYPE = 'rest-hooks/gc' as const;
