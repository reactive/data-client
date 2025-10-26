import type { MaybeRefOrGetter } from 'vue';

/** Maps each parameter to accept raw value, Ref, ComputedRef, or getter */
export type MaybeRefsOrGetters<T extends readonly any[]> = {
  readonly [K in keyof T]: MaybeRefOrGetter<T[K]>;
};

/** Maps each parameter to accept raw value, Ref, ComputedRef, or getter, with nullable support */
export type MaybeRefsOrGettersNullable<T extends readonly any[]> = {
  readonly [K in keyof T]: MaybeRefOrGetter<T[K] | null>;
};
