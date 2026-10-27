"use client";

import { Loader2 } from "lucide-react";
import NextLink from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariante = "primario" | "secundario" | "discreto" | "perigoso" | "inverso" | "vazado";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: ButtonVariante;
  carregando?: boolean;
  textoCarregando?: string;
  // Início novo: "Retomar {tipo}" navega pra uma sessão que já existe — é Link
  // com cara de botão, não um botão que inicia sessão (esse continua <button>,
  // com carregando/aria-busy). Quando `href` existe, ignora carregando/disabled
  // (não se aplica a navegação).
  href?: string;
}

const CLASSES_VARIANTE: Record<ButtonVariante, string> = {
  primario: "bg-brand text-on-brand hover:bg-brand-hover disabled:opacity-60",
  secundario: "bg-transparent text-ink border border-rule-strong hover:bg-paper-2 disabled:opacity-60",
  discreto: "bg-transparent text-brand-ink hover:bg-brand-soft disabled:opacity-60",
  perigoso: "bg-err text-on-err hover:opacity-90 disabled:opacity-60",
  // Etapa V: pro botão grande da faixa sólida da marca do Início — "primario"
  // (bg-brand) quase some em cima de --brand-ink (são a mesma cor no tema escuro).
  inverso: "bg-paper text-brand-ink hover:bg-paper-2 disabled:opacity-60",
  // Início novo: contorno na cor da marca (diferente de "secundario", que usa
  // --rule-strong/--ink) — pro segundo cartão de "Seu próximo passo", que não é
  // a ação principal da tela mas ainda é uma ação da marca.
  vazado: "border border-brand bg-transparent text-brand-ink hover:bg-brand-soft disabled:opacity-60",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variante = "primario", carregando = false, textoCarregando, className, children, disabled, href, ...props },
  ref,
) {
  const classeBase = cn(
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-sm px-4 text-sm font-medium no-underline",
    "motion-safe-transition",
    CLASSES_VARIANTE[variante],
    className,
  );

  if (href) {
    return (
      <NextLink href={href} className={classeBase}>
        {children}
      </NextLink>
    );
  }

  return (
    <button
      ref={ref}
      type={props.type ?? "button"}
      disabled={disabled || carregando}
      aria-disabled={disabled || carregando || undefined}
      aria-busy={carregando || undefined}
      className={classeBase}
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
