"use client";

import { createContext, ReactNode, useContext, useState } from "react";

type ToastTone = "success" | "error" | "info";

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastCtx {
  show: (message: string, tone?: ToastTone) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function useToast() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useToast must be used within <ToastProvider>");
  return c;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const show = (message: string, tone: ToastTone = "info") => {
    const id = Date.now() + Math.random();
    setItems((p) => [...p, { id, tone, message }]);
    setTimeout(() => setItems((p) => p.filter((t) => t.id !== id)), 4000);
  };

  const toneClass: Record<ToastTone, string> = {
    success: "bg-success text-inverse",
    error: "bg-error text-inverse",
    info: "bg-ink text-inverse",
  };

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      {/* Persistent polite live region so screen readers announce toasts as
          they appear. Toasts themselves are plain (no role) to avoid
          double-announcement from a nested live region. */}
      <div
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions"
        className="fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 flex-col gap-2 md:left-4 md:translate-x-0"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={`rounded-md px-4 py-3 text-body shadow-lg ${toneClass[t.tone]}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
