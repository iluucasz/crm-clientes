"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

type ToastKind = "ok" | "warn" | "err" | "info";
interface Toast {
  id: number;
  html: string;
  kind: ToastKind;
  out?: boolean;
}

const ToastCtx = createContext<(html: string, kind?: ToastKind) => void>(
  () => {}
);

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const toast = useCallback((html: string, kind: ToastKind = "ok") => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, html, kind }]);
    setTimeout(() => {
      setToasts((t) => t.map((x) => (x.id === id ? { ...x, out: true } : x)));
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 320);
    }, 4200);
  }, []);

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="toasts">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast ${t.kind === "ok" ? "" : t.kind} ${
              t.out ? "out" : ""
            }`}
            dangerouslySetInnerHTML={{ __html: t.html }}
          />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
