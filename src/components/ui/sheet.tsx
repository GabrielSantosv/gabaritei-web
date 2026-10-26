"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  titulo: string;
  descricao?: string;
  lado?: "direita" | "baixo";
}

const CLASSES_LADO: Record<NonNullable<SheetContentProps["lado"]>, string> = {
  direita: "inset-y-0 right-0 h-full w-[min(92vw,26rem)] border-l",
  baixo: "inset-x-0 bottom-0 max-h-[85vh] w-full rounded-t-md border-t",
};

export function SheetContent({ titulo, descricao, lado = "direita", className, children, ...props }: SheetContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/40" />
      <DialogPrimitive.Content
        className={cn(
          "fixed z-50 overflow-y-auto border-rule bg-card p-6 shadow-[var(--shadow-overlay)]",
          CLASSES_LADO[lado],
          className,
        )}
        {...props}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <DialogPrimitive.Title className="font-display text-xl text-ink">{titulo}</DialogPrimitive.Title>
            {descricao ? (
              <DialogPrimitive.Description className="mt-1 text-sm text-ink-2">{descricao}</DialogPrimitive.Description>
            ) : (
              <VisuallyHidden.Root asChild>
                <DialogPrimitive.Description>Painel.</DialogPrimitive.Description>
              </VisuallyHidden.Root>
            )}
          </div>
          <DialogPrimitive.Close
            aria-label="Fechar"
            className="flex size-12 shrink-0 items-center justify-center rounded-sm text-ink-2 hover:bg-paper-2 hover:text-ink"
          >
            <X className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </DialogPrimitive.Close>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
