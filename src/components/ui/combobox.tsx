"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Check, ChevronDown } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { cn } from "@/lib/cn";

export interface ComboboxOpcao {
  valor: string;
  rotulo: string;
  grupo?: string;
}

export interface ComboboxProps {
  rotulo: string;
  opcoes: ComboboxOpcao[];
  valor: string | null;
  onValorChange: (valor: string | null) => void;
  placeholder?: string;
  className?: string;
}

/** Combobox com busca, agrupado (usado para habilidades: código + descrição, por área). */
export function Combobox({ rotulo, opcoes, valor, onValorChange, placeholder, className }: ComboboxProps) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const idGerado = useId();

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return opcoes;
    return opcoes.filter((o) => o.rotulo.toLowerCase().includes(termo) || o.valor.toLowerCase().includes(termo));
  }, [opcoes, busca]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, ComboboxOpcao[]>();
    for (const opcao of filtradas) {
      const chave = opcao.grupo ?? "";
      mapa.set(chave, [...(mapa.get(chave) ?? []), opcao]);
    }
    return [...mapa.entries()];
  }, [filtradas]);

  const selecionada = opcoes.find((o) => o.valor === valor);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={idGerado} className="text-sm font-medium text-ink">
        {rotulo}
      </label>
      <PopoverPrimitive.Root open={aberto} onOpenChange={setAberto}>
        <PopoverPrimitive.Trigger asChild>
          <button
            id={idGerado}
            type="button"
            className="flex min-h-12 w-full items-center justify-between rounded-sm border border-rule-strong bg-card px-3 text-left text-base text-ink"
          >
            <span className={cn(!selecionada && "text-ink-2")}>
              {selecionada ? selecionada.rotulo : placeholder ?? "Selecionar"}
            </span>
            <ChevronDown className="size-4 text-ink-2" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={4}
            className="z-50 w-[var(--radix-popover-trigger-width)] rounded-sm border border-rule-strong bg-card p-2 shadow-[var(--shadow-overlay)]"
          >
            <input
              autoFocus
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por código ou texto"
              aria-label={`Buscar em ${rotulo}`}
              className="mb-2 min-h-12 w-full rounded-xs border border-rule-strong bg-paper px-3 text-sm text-ink"
            />
            <ul role="listbox" aria-label={rotulo} className="max-h-64 overflow-y-auto">
              {grupos.length === 0 ? (
                <li className="px-3 py-2 text-sm text-ink-2">Nenhum resultado.</li>
              ) : (
                grupos.map(([grupo, itens]) => (
                  <li key={grupo || "sem-grupo"}>
                    {grupo ? <p className="px-3 pt-2 pb-1 text-xs text-ink-2">{grupo}</p> : null}
                    <ul>
                      {itens.map((opcao) => (
                        <li key={opcao.valor}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={opcao.valor === valor}
                            onClick={() => {
                              onValorChange(opcao.valor === valor ? null : opcao.valor);
                              setAberto(false);
                              setBusca("");
                            }}
                            className={cn(
                              "flex min-h-12 w-full items-center justify-between gap-2 rounded-xs px-3 text-left text-sm text-ink hover:bg-paper-2",
                              opcao.valor === valor && "bg-brand-soft",
                            )}
                          >
                            <span>{opcao.rotulo}</span>
                            {opcao.valor === valor ? (
                              <Check className="size-4 text-brand-ink" strokeWidth={1.75} aria-hidden="true" />
                            ) : null}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))
              )}
            </ul>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </div>
  );
}
