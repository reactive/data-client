import { useSyncExternalStore } from 'react';

/** A button on the toast (Undo); pressing it also dismisses the toast */
export interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: number;
  kind: 'success' | 'error' | 'info';
  message: string;
  action?: ToastAction;
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

const dismiss = (shown: Toast) => setToasts(toasts.filter(t => t !== shown));

function show(kind: Toast['kind'], message: string, action?: ToastAction) {
  const added = { id: nextId++, kind, message, action };
  setToasts([...toasts, added]);
  setTimeout(() => dismiss(added), SHOW_MS);
}

/** The app's notifications, as a toast library (e.g. sonner) gives a real app.
 * `info` is neutral news, like a removal its `action` can undo */
export const toast = {
  success: (message: string, action?: ToastAction) =>
    show('success', message, action),
  error: (message: string, action?: ToastAction) =>
    show('error', message, action),
  info: (message: string, action?: ToastAction) =>
    show('info', message, action),
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
          {t.action && (
            <button
              type="button"
              onClick={() => {
                dismiss(t);
                t.action?.onClick();
              }}
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
