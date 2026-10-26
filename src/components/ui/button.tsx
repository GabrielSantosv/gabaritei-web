"use client";

import { Loader2 } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariante = "primario" | "secundario" | "discreto" | "perigoso" | "inverso";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: ButtonVariante;
  carregando?: boolean;
  textoCarregando?: string;
}

const CLASSES_VARIANTE: Record<ButtonVariante, string> = {
  primario: "bg-brand text-on-brand hover:bg-brand-hover disabled:opacity-60",
  secundario: "bg-transparent text-ink border border-rule-strong hover:bg-paper-2 disabled:opacity-60",
  discreto: "bg-transparent text-brand-ink hover:bg-brand-soft disabled:opacity-60",
  perigoso: "bg-err text-on-err hover:opacity-90 disabled:opacity-60",
  // Etapa V: pro botão grande da faixa sólida da marca do Início — "primario"
  // (bg-brand) quase some em cima de --brand-ink (são a mesma cor no tema escuro).
  inverso: "bg-paper text-brand-ink hover:bg-paper-2 disabled:opacity-60",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variante = "primario", carregando = false, textoCarregando, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={props.type ?? "button"}
      disabled={disabled || carregando}
      aria-disabled={disabled || carregando || undefined}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-sm px-4 text-sm font-medium",
        "motion-safe-transition",
        CLASSES_VARIANTE[variante],
        className,
      )}
      {...props}
    >
      {carregando ? (
        <>
          <Loader2 className="size-4 animate-spin" strokeWidth={1.75} aria-hidden="true" />
          <span>{textoCarregando ?? "Carregando"}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
});
