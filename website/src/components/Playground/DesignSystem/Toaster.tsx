import { useSyncExternalStore } from 'react';

interface Toast {
  id: number;
  kind: 'success' | 'error';
  message: string;
}

/** How long a toast stays on screen */
export const SHOW_MS = 4000;

// Module state, like a toast library's: the preview's code re-runs on every
// edit, but this module doesn't, so code kept from an earlier run (a Manager)
// and the current run's <Toaster /> share it.
let toasts: readonly Toast[] = [];
let nextId = 0;
const listeners = new Set<() => void>();

function setToasts(next: readonly Toast[]) {
  toasts = next;
  listeners.forEach(listener => listener());
}

function show(kind: Toast['kind'], message: string) {
  const added = { id: nextId++, kind, message };
  setToasts([...toasts, added]);
  setTimeout(() => setToasts(toasts.filter(t => t !== added)), SHOW_MS);
}

/** The app's notifications, as a toast library (e.g. sonner) gives a real app */
export const toast = {
  success: (message: string) => show('success', message),
  error: (message: string) => show('error', message),
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const getToasts = () => toasts;

/** Shows what `toast` sends: render it once, where the app's toasts go */
export function Toaster() {
  const list = useSyncExternalStore(subscribe, getToasts, getToasts);
  return (
    <div className="toaster" role="status">
      {list.map(t => (
        <div key={t.id} className="toast" data-kind={t.kind}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
