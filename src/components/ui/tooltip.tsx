"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/cn";

export const TooltipProvider = TooltipPrimitive.Provider;

export interface TooltipProps {
  conteudo: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/** Tooltip nunca carrega informação que só existe nele (seção 9) — é sempre complemento. */
export function Tooltip({ conteudo, children, className }: TooltipProps) {
  return (
    <TooltipPrimitive.Root delayDuration={300}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          sideOffset={6}
          className={cn(
            "z-50 rounded-xs bg-ink px-2.5 py-1.5 text-xs text-paper shadow-[var(--shadow-overlay)]",
            className,
          )}
        >
          {conteudo}
          <TooltipPrimitive.Arrow className="fill-ink" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
