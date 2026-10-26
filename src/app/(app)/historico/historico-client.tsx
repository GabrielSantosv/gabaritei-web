"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";

import { AreaTag } from "@/components/dominio/area-tag";
import { StatusChip } from "@/components/dominio/status-chip";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Link } from "@/components/ui/link";
import { PageHeader } from "@/components/layout/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getApi } from "@/lib/api/client";
import { mensagemDoErro } from "@/lib/api/errors";
import { formatarData, formatarHora } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { AbaHistorico, Area, FiltrosHistorico, ItemHistorico, ModoPratica } from "@/lib/api/types";
import { revelar } from "@/lib/reveal";

const PAGINA_TAMANHO = 20;

const ABAS: { id: AbaHistorico; nome: string }[] = [
  { id: "atividades", nome: "Atividades" },
  { id: "erradas", nome: "Erradas" },
  { id: "favoritas", nome: "Favoritas" },
  { id: "para-revisar", nome: "Para revisar" },
];

const NOME_AREA: Record<Area, string> = {
  LC: "Linguagens",
  CH: "Ciências Humanas",
  CN: "Ciências da Natureza",
  MT: "Matemática",
};

const NOME_MODO: Record<ModoPratica, string> = {
  livre: "Livre",
  tema: "Por tema",
  habilidade: "Por habilidade",
  nivel: "Por nível",
  progressao: "Progressão com Combo",
  simulado: "Simulado",
};

interface EstadoFiltros {
  aba: AbaHistorico;
  periodo: "" | "7" | "30" | "90";
  area: "" | Area;
  resultado: "" | "acertou" | "errou";
  modo: "" | ModoPratica;
  pagina: number;
}

function lerEstadoDaUrl(searchParams: URLSearchParams): EstadoFiltros {
  const aba = searchParams.get("aba");
  const pagina = Number(searchParams.get("pagina") ?? "1");
  return {
    aba: ABAS.some((a) => a.id === aba) ? (aba as AbaHistorico) : "atividades",
    periodo: (searchParams.get("periodo") as EstadoFiltros["periodo"]) || "",
    area: (searchParams.get("area") as EstadoFiltros["area"]) || "",
    resultado: (searchParams.get("resultado") as EstadoFiltros["resultado"]) || "",
    modo: (searchParams.get("modo") as EstadoFiltros["modo"]) || "",
    pagina: Number.isInteger(pagina) && pagina > 0 ? pagina : 1,
  };
}

function estadoParaQueryString(estado: EstadoFiltros): string {
  const params = new URLSearchParams();
  if (estado.aba !== "atividades") params.set("aba", estado.aba);
  if (estado.periodo) params.set("periodo", estado.periodo);
  if (estado.area) params.set("area", estado.area);
  if (estado.resultado) params.set("resultado", estado.resultado);
  if (estado.modo) params.set("modo", estado.modo);
  if (estado.pagina > 1) params.set("pagina", String(estado.pagina));
  return params.toString();
}

function filtrosApi(estado: EstadoFiltros): FiltrosHistorico {
  return {
    periodo: estado.periodo || undefined,
    area: estado.area || undefined,
    resultado: estado.resultado || undefined,
    modo: estado.modo || undefined,
  };
}

/** "Hoje", "Ontem" ou a data por extenso — mesma régua usada no resto do app. */
function tituloDoDia(dataISO: string): string {
  const inicioDoDia = (d: Date) => {
    const copia = new Date(d);
    copia.setHours(0, 0, 0, 0);
    return copia.getTime();
  };
  const dia = inicioDoDia(new Date(`${dataISO}T00:00:00`));
  const hoje = inicioDoDia(new Date());
  const ontem = hoje - 24 * 60 * 60 * 1000;
  if (dia === hoje) return "Hoje";
  if (dia === ontem) return "Ontem";
  return formatarData(dataISO);
}

function agruparPorDia(itens: ItemHistorico[]): { data: string; titulo: string; itens: ItemHistorico[] }[] {
  const grupos = new Map<string, ItemHistorico[]>();
  for (const item of itens) {
    const chave = item.respondidaEm.slice(0, 10);
    const lista = grupos.get(chave) ?? [];
    lista.push(item);
    grupos.set(chave, lista);
  }
  return [...grupos.entries()].map(([data, itensDoDia]) => ({ data, titulo: tituloDoDia(data), itens: itensDoDia }));
}

function LinhaHistorico({ item }: { item: ItemHistorico }) {
  return (
    <li className="flex flex-col gap-3 border-b border-rule px-4 py-4 last:border-b-0 sm:flex-row sm:items-center sm:gap-4">
      <span className="font-mono text-xs text-ink-2 sm:w-14 sm:shrink-0">{formatarHora(item.respondidaEm)}</span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <AreaTag area={item.area} />
          <span className="font-mono text-xs text-ink-2">{item.habilidade?.codigo ?? "Habilidade não informada"}</span>
          <span className="text-xs text-ink-2">{item.ano ?? "Ano não informado"}</span>
        </div>
        <p className="mt-1 text-sm font-medium text-ink">{item.titulo || "Enunciado não disponível"}</p>
      </div>

      <div className="flex shrink-0 flex-col gap-0.5 text-xs text-ink-2 sm:w-32">
        <span>
          Sua resposta <span className="font-mono font-semibold text-ink">{item.resposta}</span>
        </span>
        <span>
          Gabarito <span className="font-mono font-semibold text-ink">{item.gabarito}</span>
        </span>
      </div>

      <div className="shrink-0 sm:w-24">
        <StatusChip status={item.correta ? "acertou" : "errou"} />
      </div>

      <div className="flex shrink-0 flex-col gap-0.5 text-sm sm:w-40">
        <span>{NOME_MODO[item.modo]}</span>
        {item.versaoModelo ? <span className="font-mono text-xs text-ink-2">Modelo {item.versaoModelo}</span> : null}
      </div>

      <Link href={`/questoes/${item.questaoId}?de=historico`} className="shrink-0 self-start text-sm font-medium">
        Revisar
      </Link>
    </li>
  );
}

function PainelHistorico() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const estado = useMemo(() => lerEstadoDaUrl(searchParams), [searchParams]);

  function onMudar(parcial: Partial<EstadoFiltros>) {
    const novo = { ...estado, ...parcial };
    const qs = estadoParaQueryString(novo);
    router.replace(qs ? `/historico?${qs}` : "/historico", { scroll: false });
  }

  const contagens = useQuery({
    queryKey: ["historico-contagens", estado.periodo, estado.area, estado.resultado, estado.modo],
    queryFn: async () => {
      const resultados = await Promise.all(
        ABAS.map((a) => getApi().listarHistorico(a.id, filtrosApi(estado), { pagina: 1, porPagina: 1 })),
      );
      return Object.fromEntries(ABAS.map((a, i) => [a.id, resultados[i].total])) as Record<AbaHistorico, number>;
    },
  });

  const {
    data: pagina,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["historico", estado.aba, estado.periodo, estado.area, estado.resultado, estado.modo, estado.pagina],
    queryFn: () =>
      getApi().listarHistorico(estado.aba, filtrosApi(estado), { pagina: estado.pagina, porPagina: PAGINA_TAMANHO }),
  });

  const grupos = useMemo(() => (pagina ? agruparPorDia(pagina.itens) : []), [pagina]);
  const totalPaginas = pagina ? Math.max(1, Math.ceil(pagina.total / PAGINA_TAMANHO)) : 1;

  return (
    <div>
      <PageHeader titulo="Histórico" descricao="Tudo o que você respondeu, da mais recente para a mais antiga." />

      <nav aria-label="Seções do histórico" {...revelar(0)} className="flex flex-wrap border-b border-rule">
        {ABAS.map((aba) => (
          <button
            key={aba.id}
            type="button"
            aria-current={estado.aba === aba.id ? "page" : undefined}
            onClick={() => onMudar({ aba: aba.id, pagina: 1 })}
            className={cn(
              "flex min-h-12 items-center gap-2 border-b-2 px-4 text-sm font-medium motion-safe-transition",
              estado.aba === aba.id
                ? "border-b-ink text-ink"
                : "border-b-transparent text-ink-2 hover:text-ink",
            )}
          >
            <span>{aba.nome}</span>
            <span className="font-mono text-xs text-ink-2">{contagens.data?.[aba.id] ?? "…"}</span>
          </button>
        ))}
      </nav>

      <div {...revelar(1)} className="mt-5 flex flex-wrap items-end gap-4">
        <Select
          rotulo="Período"
          value={estado.periodo}
          onChange={(e) => onMudar({ periodo: e.target.value as EstadoFiltros["periodo"], pagina: 1 })}
          opcoes={[
            { valor: "", rotulo: "Tudo" },
            { valor: "7", rotulo: "Últimos 7 dias" },
            { valor: "30", rotulo: "Últimos 30 dias" },
            { valor: "90", rotulo: "Últimos 90 dias" },
          ]}
          className="w-44"
        />
        <Select
          rotulo="Área"
          value={estado.area}
          onChange={(e) => onMudar({ area: e.target.value as EstadoFiltros["area"], pagina: 1 })}
          opcoes={[{ valor: "", rotulo: "Todas" }, ...(Object.keys(NOME_AREA) as Area[]).map((a) => ({ valor: a, rotulo: NOME_AREA[a] }))]}
          className="w-44"
        />
        {estado.aba === "atividades" ? (
          <Select
            rotulo="Resultado"
            value={estado.resultado}
            onChange={(e) => onMudar({ resultado: e.target.value as EstadoFiltros["resultado"], pagina: 1 })}
            opcoes={[
              { valor: "", rotulo: "Todos" },
              { valor: "acertou", rotulo: "Acertei" },
              { valor: "errou", rotulo: "Errei" },
            ]}
            className="w-40"
          />
        ) : null}
        <Select
          rotulo="Modo"
          value={estado.modo}
          onChange={(e) => onMudar({ modo: e.target.value as EstadoFiltros["modo"], pagina: 1 })}
          opcoes={[{ valor: "", rotulo: "Todos" }, ...(Object.keys(NOME_MODO) as ModoPratica[]).map((m) => ({ valor: m, rotulo: NOME_MODO[m] }))]}
          className="w-44"
        />
      </div>

      <div {...revelar(2)} className="mt-6">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState mensagem={mensagemDoErro(error)} onTentarDeNovo={() => refetch()} />
        ) : grupos.length === 0 ? (
          <EmptyState
            titulo={
              estado.aba === "favoritas"
                ? "Nada favoritado ainda."
                : estado.aba === "para-revisar"
                  ? "Nada marcado para revisar ainda."
                  : estado.aba === "erradas"
                    ? "Nenhuma questão errada com esses filtros."
                    : "Nada por aqui ainda."
            }
            descricao="Responda questões em Treino, Questões ou Simulados e elas aparecem aqui."
          />
        ) : (
          <div className="flex flex-col gap-5">
            {grupos.map((grupo) => (
              <section key={grupo.data} aria-label={grupo.titulo} className="overflow-hidden rounded-md border border-rule">
                <div className="flex flex-wrap items-baseline justify-between gap-2 bg-paper-2 px-4 py-3">
                  <h2 className="text-base font-semibold text-ink">{grupo.titulo}</h2>
                  <span className="text-xs text-ink-2">
                    {grupo.itens.length} {grupo.itens.length === 1 ? "questão" : "questões"},{" "}
                    {grupo.itens.filter((i) => i.correta).length} acertos
                  </span>
                </div>
                <ul className="bg-card">
                  {grupo.itens.map((item) => (
                    <LinhaHistorico key={item.tentativaId} item={item} />
                  ))}
                </ul>
              </section>
            ))}

            <Pagination
              className="justify-center"
              paginaAtual={estado.pagina}
              totalPaginas={totalPaginas}
              onPaginaChange={(p) => onMudar({ pagina: p })}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function HistoricoClient() {
  return (
    <Suspense fallback={null}>
      <PainelHistorico />
    </Suspense>
  );
}
