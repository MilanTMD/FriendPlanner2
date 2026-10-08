import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

export type ToastKind = 'success' | 'error';

export interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastValue {
  toasts: ToastItem[];
  toast: (message: string, options?: { kind?: ToastKind; actionLabel?: string; onAction?: () => void }) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<ToastValue['toast']>((message, options = {}) => {
    const id = nextId.current++;
    const item: ToastItem = { id, message, kind: options.kind ?? 'success' };
    if (options.actionLabel) item.actionLabel = options.actionLabel;
    if (options.onAction) item.onAction = options.onAction;
    setToasts((list) => [...list.slice(-2), item]);
  }, []);

  const value = useMemo(() => ({ toasts, toast, dismiss }), [toasts, toast, dismiss]);
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
