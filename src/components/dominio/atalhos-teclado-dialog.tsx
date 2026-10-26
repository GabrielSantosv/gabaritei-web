"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";

export interface AtalhosTecladoDialogProps {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  itens: { tecla: string; acao: string }[];
}

/** Lista de atalhos, aberta por "?" (seção 10.2, tela 5). */
export function AtalhosTecladoDialog({ aberto, onOpenChange, itens }: AtalhosTecladoDialogProps) {
  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent titulo="Atalhos de teclado">
        <ul className="flex flex-col gap-2">
          {itens.map((item) => (
            <li key={item.tecla} className="flex items-center justify-between gap-4 text-sm">
              <span className="text-ink-2">{item.acao}</span>
              <kbd className="rounded-xs border border-rule-strong bg-paper-2 px-2 py-0.5 font-mono text-xs text-ink">
                {item.tecla}
              </kbd>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
