import { watch, type Ref } from 'vue';

/** Keeps a store response's entities from being garbage collected while mounted. */
export default function useCountRef(
  meta: Ref<{ data: unknown; countRef: () => () => void }>,
) {
  watch(
    () => meta.value.data,
    (_newVal, _oldVal, onCleanup) => {
      onCleanup(meta.value.countRef());
    },
    { immediate: true },
  );
}
