"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/cn";

export const RadioCardGroup = RadioGroupPrimitive.Root;

export interface RadioCardProps extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  titulo: string;
  descricao?: string;
  motivo?: string;
  /** Ícone com função (etapa V, item 3), traço 1.75 — nunca só decorativo. */
  Icone?: React.ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
}

/** Opção grande selecionável (seção 9), usada em grupos de rádio com poucas opções importantes. */
export function RadioCard({ titulo, descricao, motivo, Icone, className, disabled, children, ...props }: RadioCardProps) {
  return (
    <RadioGroupPrimitive.Item
      disabled={disabled}
      aria-disabled={disabled || undefined}
      className={cn(
        "group flex w-full flex-col gap-1 rounded-xs border border-rule-strong bg-card p-4 text-left",
        "data-[state=checked]:border-brand data-[state=checked]:bg-brand-soft",
        // Disabled usa cores deliberadas em vez de opacity: opacity esmaeceria também o
        // texto do "motivo", que precisa continuar legível (explica por que está desabilitado).
        "motion-safe-transition disabled:cursor-not-allowed disabled:bg-paper-2",
        className,
      )}
      {...props}
    >
      <span className="flex items-center gap-2.5">
        {Icone ? (
          <Icone className={cn("size-5 shrink-0", disabled ? "text-ink-2" : "text-brand-ink")} strokeWidth={1.75} aria-hidden={true} />
        ) : null}
        {/* Indicador de seleção sempre presente, com ou sem ícone: a borda/fundo do
            cartão sozinhos seriam "só cor" pra indicar o estado (seção 2, regra 6). */}
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-rule-strong group-data-[state=checked]:border-brand">
          <RadioGroupPrimitive.Indicator className="size-2.5 rounded-full bg-brand" />
        </span>
        <span className={cn("font-medium", disabled ? "text-ink-2" : "text-ink")}>{titulo}</span>
      </span>
      {descricao ? <span className={cn("text-sm text-ink-2", Icone ? "pl-[58px]" : "pl-[30px]")}>{descricao}</span> : null}
      {motivo ? <span className={cn("text-sm text-ink-2", Icone ? "pl-[58px]" : "pl-[30px]")}>{motivo}</span> : null}
      {children}
    </RadioGroupPrimitive.Item>
  );
}
