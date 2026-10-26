"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { CampoSalvo } from "@/components/ui/campo-salvo";
import { ErrorState } from "@/components/ui/error-state";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { SeletorPaleta } from "@/components/dominio/seletor-paleta";
import { getApi } from "@/lib/api/client";
import { mensagemDoErro } from "@/lib/api/errors";
import {
  aplicarAparencia,
  salvarAparenciaCache,
  useTemaResolvido,
  type Movimento,
  type Tema,
  type TamanhoTexto,
} from "@/lib/hooks/use-aparencia";
import { revelar } from "@/lib/reveal";
import type { Preferencias } from "@/lib/api/types";

/** Botão que reexecuta a cascata de entrada (4.4) num cartão de exemplo — remonta o
 *  bloco com uma `key` nova, o jeito padrão de reiniciar uma animação em React. */
function PreviaMovimento() {
  const [chave, setChave] = useState(0);
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setChave((c) => c + 1)}
        className="min-h-9 text-sm font-medium text-brand-ink underline underline-offset-2"
      >
        Ver prévia
      </button>
      <div key={chave} className="mt-3 flex flex-col gap-2 rounded-md border border-rule-strong bg-card p-4">
        <div {...revelar(0)} className="h-8 rounded-xs bg-paper-2" />
        <div {...revelar(1)} className="h-8 rounded-xs bg-paper-2" />
        <div {...revelar(2)} className="h-8 rounded-xs bg-paper-2" />
      </div>
    </div>
  );
}

export function ConfiguracoesClient() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["preferencias"],
    queryFn: () => getApi().obterPreferencias(),
  });

  const [local, setLocal] = useState<Preferencias | null>(null);
  const [salvandoCampo, setSalvandoCampo] = useState<keyof Preferencias | null>(null);
  const preferencias = local ?? data ?? null;
  const temaResolvido = useTemaResolvido(preferencias?.tema ?? "sistema");

  // Sincroniza o cache da primeira pintura com Preferencias ao carregar (seção 4.5).
  // Só sem edição local pendente, pra não sobrescrever uma troca otimista com o valor
  // antigo que ainda está a caminho da API.
  useEffect(() => {
    if (!data || local) return;
    const aparencia = { tema: data.tema, paleta: data.paleta, movimento: data.reduzirMovimento, tamanhoTexto: data.tamanhoTexto };
    aplicarAparencia(aparencia);
    salvarAparenciaCache(aparencia);
  }, [data, local]);

  async function salvar<C extends keyof Preferencias>(campo: C, valor: Preferencias[C]) {
    if (!preferencias) return;
    const atualizadas = { ...preferencias, [campo]: valor };
    setLocal(atualizadas);
    setSalvandoCampo(campo);
    const aparencia = {
      tema: atualizadas.tema,
      paleta: atualizadas.paleta,
      movimento: atualizadas.reduzirMovimento,
      tamanhoTexto: atualizadas.tamanhoTexto,
    };
    aplicarAparencia(aparencia);
    salvarAparenciaCache(aparencia);
    try {
      await getApi().atualizarPreferencias({ [campo]: valor });
    } finally {
      setSalvandoCampo(null);
    }
  }

  return (
    <div>
      <PageHeader titulo="Configurações" />
      <section {...revelar(0)}>
        <h2 className="mb-4 text-lg text-ink">Aparência</h2>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : error ? (
          <ErrorState mensagem={mensagemDoErro(error)} onTentarDeNovo={() => refetch()} />
        ) : preferencias ? (
          <div className="flex flex-col gap-8">
            <div className="flex flex-wrap items-center gap-3">
              <Segmented
                rotulo="Tema"
                valor={preferencias.tema}
                onValorChange={(v) => void salvar("tema", v as Tema)}
                opcoes={[
                  { valor: "sistema", rotulo: "Sistema" },
                  { valor: "claro", rotulo: "Claro" },
                  { valor: "escuro", rotulo: "Escuro" },
                ]}
              />
              <CampoSalvo salvando={salvandoCampo === "tema"} />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-ink">Paleta</p>
              <div className="flex flex-wrap items-center gap-3">
                <SeletorPaleta
                  valor={preferencias.paleta}
                  temaResolvido={temaResolvido}
                  onValorChange={(v) => void salvar("paleta", v)}
                />
                <CampoSalvo salvando={salvandoCampo === "paleta"} />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <Segmented
                  rotulo="Movimento"
                  valor={preferencias.reduzirMovimento}
                  onValorChange={(v) => void salvar("reduzirMovimento", v as Movimento)}
                  opcoes={[
                    { valor: "sistema", rotulo: "Sistema" },
                    { valor: "sim", rotulo: "Reduzido" },
                  ]}
                />
                <CampoSalvo salvando={salvandoCampo === "reduzirMovimento"} />
              </div>
              <PreviaMovimento />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Segmented
                rotulo="Tamanho do texto"
                valor={String(preferencias.tamanhoTexto)}
                onValorChange={(v) => void salvar("tamanhoTexto", Number(v) as TamanhoTexto)}
                opcoes={[
                  { valor: "100", rotulo: "100%" },
                  { valor: "115", rotulo: "115%" },
                  { valor: "130", rotulo: "130%" },
                ]}
              />
              <CampoSalvo salvando={salvandoCampo === "tamanhoTexto"} />
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
