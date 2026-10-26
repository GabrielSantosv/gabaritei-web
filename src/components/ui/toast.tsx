"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import { createContext, useCallback, useContext, useState } from "react";
import { cn } from "@/lib/cn";

interface ToastItem {
  id: string;
  titulo: string;
  descricao?: string;
  variante?: "padrao" | "erro";
}

interface ToastContexto {
  mostrarToast: (toast: Omit<ToastItem, "id">) => void;
}

const Contexto = createContext<ToastContexto | null>(null);

/** Região aria-live="polite" (seção 9). Use `useToast()` para disparar. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [itens, setItens] = useState<ToastItem[]>([]);

  const mostrarToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = crypto.randomUUID();
    setItens((atual) => [...atual, { ...toast, id }]);
  }, []);

  const remover = useCallback((id: string) => {
    setItens((atual) => atual.filter((t) => t.id !== id));
  }, []);

  return (
    <Contexto.Provider value={{ mostrarToast }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {itens.map((item) => (
          <ToastPrimitive.Root
            key={item.id}
            duration={5000}
            onOpenChange={(aberto) => {
              if (!aberto) remover(item.id);
            }}
            className={cn(
              "rounded-sm border border-rule bg-card p-4 shadow-[var(--shadow-overlay)]",
              item.variante === "erro" && "border-l-[3px] border-l-err",
            )}
          >
            <ToastPrimitive.Title className="font-medium text-ink">{item.titulo}</ToastPrimitive.Title>
            {item.descricao ? (
              <ToastPrimitive.Description className="mt-1 text-sm text-ink-2">{item.descricao}</ToastPrimitive.Description>
            ) : null}
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-50 flex w-[min(92vw,22rem)] flex-col gap-2" />
      </ToastPrimitive.Provider>
    </Contexto.Provider>
  );
}

export function useToast(): ToastContexto {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("useToast precisa estar dentro de <ToastProvider>.");
  return contexto;
}
