import { useCallback, useState, useTransition } from 'react';

export default function useNavigationState<T>(init: T) {
  const [value, set] = useState(init);
  const [loading, startTransition] = useTransition();
  const navigate = useCallback(
    (v: T) => {
      startTransition(() => set(v));
    },
    [set],
  );
  return [value, navigate, loading] as const;
}
