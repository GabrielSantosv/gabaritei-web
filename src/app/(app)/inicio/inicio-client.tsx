"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ClipboardCheck, ListChecks, Stethoscope, Zap } from "lucide-react";

import { AreaTag } from "@/components/dominio/area-tag";
import { AreaTile } from "@/components/dominio/area-tile";
import { FoguinhoBadge } from "@/components/dominio/foguinho-badge";
import { WeekStrip } from "@/components/dominio/week-strip";
import { AnelProgresso } from "@/components/ui/anel-progresso";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Field } from "@/components/ui/field";
import { Link } from "@/components/ui/link";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ProgressToMinimum } from "@/components/ui/progress-to-minimum";
import { Skeleton } from "@/components/ui/skeleton";
import { getApi } from "@/lib/api/client";
import { mensagemDoErro } from "@/lib/api/errors";
import { cn } from "@/lib/cn";
import { useTemaResolvido } from "@/lib/hooks/use-aparencia";
import { formatarNumero, formatarPercentual, formatarTempoRelativo } from "@/lib/format";
import type { Area, AtividadeEmAndamento, Perfil } from "@/lib/api/types";
import { limparDescricaoHabilidadeMock } from "@/lib/questoes-filtros";
import { revelar } from "@/lib/reveal";
import { salvarFilaSessao, salvarSessaoAtivaId } from "@/lib/sessao-ativa";

const AREAS: Area[] = ["LC", "CH", "CN", "MT"];
const NOME_AREA: Record<Area, string> = {
  LC: "Linguagens",
  CH: "Ciências Humanas",
  CN: "Ciências da Natureza",
  MT: "Matemática",
};

const ROTULO_TIPO: Record<
  AtividadeEmAndamento["tipo"],
  { Icone: typeof Zap; artigo: string; verbo: string; rota: (id: string) => string | null }
> = {
  sessao: { Icone: Zap, artigo: "seu treino", verbo: "Retomar treino", rota: (id) => `/treino/${id}` },
  simulado: {
    Icone: ClipboardCheck,
    artigo: "seu simulado",
    verbo: "Retomar simulado",
    rota: (id) => `/simulados/${id}`,
  },
  // "lista" e "diagnóstico" fazem parte do contrato (seção 5) mas ainda não têm
  // rota própria (Fase 2) nem o mock os produz — ver docs/CONTRATO_PARIDADE.md.
  lista: { Icone: ListChecks, artigo: "sua lista", verbo: "Retomar lista", rota: () => null },
  diagnostico: { Icone: Stethoscope, artigo: "seu diagnóstico", verbo: "Retomar diagnóstico", rota: () => null },
};

function saudacaoPeloHorario(hora: number): string {
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

/** Apelido, senão primeiro nome, nunca o e-mail (seção 6, P2, item 1). */
function nomeDeExibicao(perfil?: Perfil): string {
  if (!perfil) return "";
  return perfil.apelido || perfil.nome.split(" ")[0] || "";
}

function Bloco({
  titulo,
  carregando,
  erro,
  onTentarDeNovo,
  children,
}: {
  titulo?: string;
  carregando: boolean;
  erro: unknown;
  onTentarDeNovo: () => void;
  children: React.ReactNode;
}) {
  return (
    <section>
      {titulo ? <h2 className="mb-3 text-lg text-ink">{titulo}</h2> : null}
      {carregando ? (
        <Skeleton className="h-24 w-full" />
      ) : erro ? (
        <ErrorState mensagem={mensagemDoErro(erro)} onTentarDeNovo={onTentarDeNovo} />
      ) : (
        children
      )}
    </section>
  );
}

/**
 * Faixa principal (seção 4.3 e 6, P2, item 1): sólido da marca, saudação pelo
 * nome de exibição e horário, a próxima ação numa frase, um botão grande.
 * Claro: fundo `--brand-hover`, texto `--on-brand`. Escuro: fundo `--brand-soft`,
 * texto `--ink`/`--ink-2`. O botão principal usa a variante "inverso" (já
 * existia, feita pra esse fundo); o segundo botão, contornado, herda a cor do
 * texto da própria faixa via `currentColor` (`!border-current !text-current`),
 * pra funcionar nos dois temas sem token novo.
 */
function FaixaPrincipal() {
  const router = useRouter();
  const [hora] = useState(() => new Date().getHours());
  const [acao, setAcao] = useState<"comecar" | "auto" | null>(null);

  const { data: perfil } = useQuery({ queryKey: ["perfil"], queryFn: () => getApi().obterPerfil() });
  const { data: preferencias } = useQuery({ queryKey: ["preferencias"], queryFn: () => getApi().obterPreferencias() });
  const temaResolvido = useTemaResolvido(preferencias?.tema ?? "sistema");

  const {
    data: atividades,
    isLoading: carregandoAtividades,
    error: erroAtividades,
    refetch: refazerAtividades,
  } = useQuery({ queryKey: ["atividades-em-andamento"], queryFn: () => getApi().listarAtividadesEmAndamento() });

  const {
    data: regularidade,
    isLoading: carregandoRegularidade,
    error: erroRegularidade,
    refetch: refazerRegularidade,
  } = useQuery({ queryKey: ["regularidade"], queryFn: () => getApi().obterRegularidade() });

  const nome = nomeDeExibicao(perfil);
  const saudacao = `${saudacaoPeloHorario(hora)}${nome ? `, ${nome}` : ""}.`;
  const atividade = atividades?.[0];
  const rotaAtividade = atividade ? ROTULO_TIPO[atividade.tipo].rota(atividade.id) : null;
  const claro = temaResolvido === "light";
  const faltamMeta = regularidade ? Math.max(0, regularidade.metaSemanal.alvo - regularidade.metaSemanal.feito) : 0;

  async function comecarTreino() {
    setAcao("comecar");
    // Sem "modo padrão de treino" no contrato ainda (TODO(equipe), ver
    // docs/CONTRATO_PARIDADE.md): sempre leva pra escolha de modo.
    router.push("/treino");
  }

  async function deixarModeloEscolher() {
    setAcao("auto");
    try {
      const { sessao, primeira } = await getApi().iniciarSessao({ modo: "auto" });
      salvarSessaoAtivaId(sessao.id);
      salvarFilaSessao(sessao.id, { itens: primeira.itens, aviso: primeira.aviso, modelo: primeira.modelo });
      router.push(`/treino/${sessao.id}`);
    } finally {
      setAcao(null);
    }
  }

  return (
    <Bloco
      carregando={carregandoAtividades || carregandoRegularidade}
      erro={erroAtividades || erroRegularidade}
      onTentarDeNovo={() => {
        void refazerAtividades();
        void refazerRegularidade();
      }}
    >
      <section
        className={cn(
          "faixa-principal rounded-md p-6 lg:p-8",
          claro ? "bg-brand-hover text-on-brand" : "bg-brand-soft text-ink",
        )}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <h1 tabIndex={-1} className="font-display text-3xl">
              {saudacao}
            </h1>
            <p className={cn("mt-2 max-w-md text-lg", !claro && "text-ink-2")}>
              {atividade
                ? `Retome ${ROTULO_TIPO[atividade.tipo].artigo}${atividade.area ? ` de ${NOME_AREA[atividade.area]}` : ""}: ${atividade.feitas} de ${atividade.total} feitas.`
                : "Bora treinar?"}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {atividade && rotaAtividade ? (
                <Button variante="inverso" onClick={() => router.push(rotaAtividade)}>
                  {ROTULO_TIPO[atividade.tipo].verbo}
                </Button>
              ) : (
                <Button
                  variante="inverso"
                  onClick={comecarTreino}
                  carregando={acao === "comecar"}
                  textoCarregando="Abrindo"
                >
                  Começar treino
                </Button>
              )}
              <Button
                variante="secundario"
                className="!border-current !text-current hover:!bg-transparent hover:opacity-80"
                onClick={deixarModeloEscolher}
                carregando={acao === "auto"}
                textoCarregando="Escolhendo"
              >
                Deixar o modelo escolher
              </Button>
            </div>
          </div>

          {regularidade ? (
            <div className="flex items-center gap-6">
              <FoguinhoBadge
                atual={regularidade.foguinho.atual}
                melhor={regularidade.foguinho.melhor}
                hojeContou={regularidade.foguinho.hojeContou}
                emRisco={regularidade.foguinho.emRisco}
                dentroDaFaixa
              />
              <div className="flex items-center gap-3">
                <AnelProgresso
                  valor={regularidade.metaSemanal.feito}
                  total={regularidade.metaSemanal.alvo}
                  rotulo="Meta semanal de questões"
                />
                <p className={cn("max-w-32 text-sm", !claro && "text-ink-2")}>
                  {faltamMeta > 0
                    ? `Faltam ${faltamMeta} ${faltamMeta === 1 ? "questão" : "questões"} para sua meta.`
                    : "Meta da semana concluída."}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </Bloco>
  );
}

/** Seus números (seção 6, P2, item 2): um único painel com divisores, nunca
 *  quatro cartões iguais. Sem proficiência nem "desempenho" agregado aqui —
 *  isso fica no Perfil e no Desempenho (P4). Sem número inventado: conta nova
 *  vira convite de texto. */
function PainelNumeros() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["resumo-geral"],
    queryFn: () => getApi().obterResumoGeral(),
  });

  return (
    <Bloco titulo="Seus números" carregando={isLoading} erro={error} onTentarDeNovo={() => refetch()}>
      {data && data.respondidas === 0 ? (
        <p className="text-sm text-ink-2">Responda algumas questões para ver seus números aqui.</p>
      ) : data ? (
        <div className="grid grid-cols-2 divide-x divide-y divide-rule rounded-md border border-rule sm:grid-cols-4 sm:divide-y-0">
          <div className="p-4">
            <p className="font-display text-2xl text-ink">{formatarNumero(data.respondidas)}</p>
            <p className="text-xs text-ink-2">Questões respondidas</p>
            <p className="text-xs text-ink-2">{formatarNumero(data.respondidasSemana)} nesta semana</p>
          </div>
          <div className="p-4">
            <p className="font-display text-2xl text-ink">{formatarPercentual((data.taxaAcerto ?? 0) * 100)}</p>
            <p className="text-xs text-ink-2">Taxa de acerto</p>
          </div>
          <div className="p-4">
            <p className="font-display text-2xl text-ink">{formatarNumero(data.simuladosConcluidos)}</p>
            <p className="text-xs text-ink-2">Simulados concluídos</p>
          </div>
          <div className="p-4">
            <p className="font-display text-2xl text-ink">{formatarNumero(data.sessoesConcluidas)}</p>
            <p className="text-xs text-ink-2">Treinos concluídos</p>
          </div>

          {/* Mesma taxa de acerto de cima, quebrada por área — não é proficiência
              (estimativa do modelo, com intervalo e tendência), que fica de fora
              do Início de propósito (seção 6, P2, item 2). */}
          <div className="col-span-2 grid grid-cols-2 gap-3 border-t border-rule p-4 sm:col-span-4 sm:grid-cols-4">
            {data.porArea.map((item) => (
              <div key={item.area} className="flex items-center justify-between gap-2">
                <AreaTag area={item.area} />
                <span className="font-display text-sm font-semibold text-ink">
                  {item.taxaAcerto !== null ? formatarPercentual(item.taxaAcerto * 100) : "Sem dados"}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </Bloco>
  );
}

/** Continue de onde parou (seção 6, P2, item 3): até 3 atividades. */
function BlocoContinuar() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["atividades-em-andamento"],
    queryFn: () => getApi().listarAtividadesEmAndamento(),
  });

  return (
    <Bloco titulo="Continue de onde parou" carregando={isLoading} erro={error} onTentarDeNovo={() => refetch()}>
      {data && data.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {data.map((atividade) => {
            const { Icone, verbo, rota } = ROTULO_TIPO[atividade.tipo];
            const destino = rota(atividade.id);
            return (
              <li key={atividade.id} className="flex items-center gap-4 rounded-md border border-rule p-4">
                <Icone className="size-5 shrink-0 text-ink-2" strokeWidth={1.75} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{atividade.titulo}</p>
                  <ProgressBar
                    valor={atividade.feitas}
                    total={atividade.total}
                    rotulo={atividade.titulo}
                    className="mt-2"
                  />
                  <p className="mt-1 text-xs text-ink-2">{formatarTempoRelativo(atividade.atualizadaEm)}</p>
                </div>
                {destino ? <Link href={destino}>{verbo}</Link> : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-ink-2">Nada em andamento. Comece um treino e ele aparece aqui.</p>
      )}
    </Bloco>
  );
}

/** Por onde começar (seção 6, P2, item 4): só pra quem ainda não tem histórico. */
function BlocoEscolherAreaETema() {
  const router = useRouter();
  const [tema, setTema] = useState("");
  const [areas, setAreas] = useState<Area[]>([]);
  const [iniciando, setIniciando] = useState(false);

  const { data: resumoGeral } = useQuery({ queryKey: ["resumo-geral"], queryFn: () => getApi().obterResumoGeral() });
  // undefined = ainda carregando: espera confirmar respondidas === 0 antes de
  // mostrar (bug real, achado via e2e: sem isso o bloco aparecia pra qualquer
  // conta, com ou sem histórico, enquanto a consulta não resolvia).
  if (resumoGeral === undefined || resumoGeral.respondidas !== 0) return null;

  async function comecarComTema() {
    setIniciando(true);
    try {
      const { sessao, primeira } = await getApi().iniciarSessao({
        modo: "tema",
        areas: areas.length ? areas : undefined,
        temaTexto: tema || undefined,
        quantidade: 10,
      });
      salvarSessaoAtivaId(sessao.id);
      salvarFilaSessao(sessao.id, { itens: primeira.itens, aviso: primeira.aviso, modelo: primeira.modelo });
      router.push(`/treino/${sessao.id}`);
    } finally {
      setIniciando(false);
    }
  }

  return (
    <Bloco titulo="Por onde começar" carregando={false} erro={null} onTentarDeNovo={() => {}}>
      <div className="grid grid-cols-2 gap-3">
        {AREAS.map((area) => (
          <AreaTile
            key={area}
            area={area}
            checked={areas.includes(area)}
            onCheckedChange={() =>
              setAreas((atual) => (atual.includes(area) ? atual.filter((a) => a !== area) : [...atual, area]))
            }
          />
        ))}
      </div>
      <div className="mt-4">
        <Field
          rotulo="Tema (opcional)"
          placeholder="Ex.: revolução industrial"
          value={tema}
          onChange={(e) => setTema(e.target.value)}
        />
      </div>
      <Button onClick={comecarComTema} carregando={iniciando} textoCarregando="Preparando" className="mt-4">
        Começar treino
      </Button>
    </Bloco>
  );
}

/** Reforço prioritário (seção 6, P2, item 5): até 3 itens do RF10. */
function BlocoReforco() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["reforco"],
    queryFn: () => getApi().obterReforco(),
  });

  return (
    <Bloco titulo="Reforço prioritário" carregando={isLoading} erro={error} onTentarDeNovo={() => refetch()}>
      {data?.status === "dados_insuficientes" ? (
        <ProgressToMinimum
          atual={data.respostasAtuais}
          minimo={data.respostasMinimas}
          rotulo="apontar o que reforçar"
        />
      ) : data && data.prioridades.length > 0 ? (
        <ol className="flex flex-col gap-3">
          {data.prioridades.slice(0, 3).map((p) => (
            <li key={p.habilidade.codigo} className="flex items-center justify-between gap-3 border-b border-rule pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <AreaTag area={p.area} />
                  <span className="text-sm text-ink">{p.habilidade.codigo}</span>
                </div>
                <p className="mt-1 text-xs text-ink-2">
                  {limparDescricaoHabilidadeMock(p.habilidade.descricao) ?? "sem descrição"}
                </p>
                <p className="mt-1 text-xs text-ink-2">
                  {Math.round(p.taxaAcerto * 100)}% de acerto em {p.respostas} respostas
                </p>
              </div>
              <Link href={`/treino?modo=habilidade&habilidade=${p.habilidade.codigo}&area=${p.area}`}>Treinar</Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-ink-2">Nenhuma prioridade de reforço no momento.</p>
      )}
    </Bloco>
  );
}

/** Semana (seção 6, P2, item 6): WeekStrip de 7 dias, hoje destacado. */
function BlocoSemana() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["regularidade"],
    queryFn: () => getApi().obterRegularidade(),
  });

  return (
    <Bloco titulo="Semana" carregando={isLoading} erro={error} onTentarDeNovo={() => refetch()}>
      {data ? (
        <div>
          <WeekStrip dias={data.semana} />
          <p className="mt-3 text-sm text-ink-2">
            {data.metaSemanal.feito} de {data.metaSemanal.alvo} questões esta semana
          </p>
        </div>
      ) : null}
    </Bloco>
  );
}

export function InicioClient() {
  return (
    <div>
      <div {...revelar(0)}>
        <FaixaPrincipal />
      </div>

      <div className="mt-8 flex flex-col gap-8">
        <div {...revelar(1)}>
          <PainelNumeros />
        </div>
        <div {...revelar(2)}>
          <BlocoContinuar />
        </div>
        <div {...revelar(3)}>
          <BlocoEscolherAreaETema />
        </div>
        <div {...revelar(4)}>
          <BlocoReforco />
        </div>
        <div {...revelar(5)}>
          <BlocoSemana />
        </div>
      </div>
    </div>
  );
}
