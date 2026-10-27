"use client";

import { useQuery } from "@tanstack/react-query";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronRight, Zap } from "lucide-react";

import { AreaTag } from "@/components/dominio/area-tag";
import { CartaoRespostaMini } from "@/components/dominio/cartao-resposta-mini";
import { CriterioRecomendacao } from "@/components/dominio/criterio-recomendacao";
import { FoguinhoBadge } from "@/components/dominio/foguinho-badge";
import { NotaNeutra } from "@/components/dominio/nota-neutra";
import { ITENS_NAV } from "@/components/layout/nav-itens";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Link } from "@/components/ui/link";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ProgressToMinimum } from "@/components/ui/progress-to-minimum";
import { Skeleton } from "@/components/ui/skeleton";
import { getApi } from "@/lib/api/client";
import { mensagemDoErro } from "@/lib/api/errors";
import { estadoCartaoAtividade, estadoCartaoProximo } from "@/lib/inicio-estado";
import type { Area, AtividadeEmAndamento, Perfil } from "@/lib/api/types";
import { revelar } from "@/lib/reveal";
import { salvarFilaSessao, salvarSessaoAtivaId } from "@/lib/sessao-ativa";

const NOME_AREA: Record<Area, string> = {
  LC: "Linguagens",
  CH: "Ciências Humanas",
  CN: "Ciências da Natureza",
  MT: "Matemática",
};

const ROTULO_TIPO: Record<
  AtividadeEmAndamento["tipo"],
  { artigo: string; verbo: string; pilula: string; rota: (id: string) => string | null }
> = {
  sessao: { artigo: "seu treino", verbo: "Retomar treino", pilula: "Treino em andamento", rota: (id) => `/treino/${id}` },
  simulado: {
    artigo: "seu simulado",
    verbo: "Retomar simulado",
    pilula: "Simulado em andamento",
    rota: (id) => `/simulados/${id}`,
  },
  // "lista" e "diagnóstico" fazem parte do contrato (seção 5) mas ainda não têm
  // rota própria (Fase 2) nem o mock os produz — ver docs/CONTRATO_PARIDADE.md.
  lista: { artigo: "sua lista", verbo: "Retomar lista", pilula: "Lista em andamento", rota: () => null },
  diagnostico: {
    artigo: "seu diagnóstico",
    verbo: "Retomar diagnóstico",
    pilula: "Diagnóstico em andamento",
    rota: () => null,
  },
};

const TEXTO_PREPARANDO = "Preparando o treino";

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

/**
 * Faixa (docs/FRONTEND_IDENTIDADE.md, seção 5.1): saudação + selo do Foguinho,
 * h1 fixo, apoio, folha decorativa. Sem botões. Mantém a classe
 * "faixa-principal" (globals.css) pro anel de foco ter contraste bom em cima
 * de --band no tema claro — já auditado, não é novo.
 */
function Faixa() {
  const [hora] = useState(() => new Date().getHours());
  const { data: perfil } = useQuery({ queryKey: ["perfil"], queryFn: () => getApi().obterPerfil() });
  const { data: regularidade } = useQuery({ queryKey: ["regularidade"], queryFn: () => getApi().obterRegularidade() });

  const nome = nomeDeExibicao(perfil);
  const saudacao = `${saudacaoPeloHorario(hora)}${nome ? `, ${nome}` : ""}.`;

  return (
    <section
      aria-labelledby="titulo-inicio"
      className="faixa-principal flex flex-wrap items-center justify-between gap-8 rounded-md bg-band px-6 py-8 text-on-band sm:gap-12 sm:px-12 sm:py-11"
    >
      <div className="flex min-w-0 flex-1 basis-80 flex-col items-start gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="m-0 text-[0.9375rem]">{saudacao}</p>
          {regularidade ? (
            <FoguinhoBadge
              variante="chip"
              atual={regularidade.foguinho.atual}
              hojeContou={regularidade.foguinho.hojeContou}
              emRisco={regularidade.foguinho.emRisco}
            />
          ) : null}
        </div>
        <h1
          id="titulo-inicio"
          className="m-0 text-balance font-display text-[2.125rem] font-semibold leading-[1.08] sm:text-[2.8125rem]"
        >
          Estude para o ENEM com a ajuda do Gabaritei.
        </h1>
        <p className="m-0 max-w-[50ch] text-lg leading-[1.55] text-on-band-2">
          Resolva questões de provas anteriores. A IA aprende com seus acertos e erros, indica o que estudar a seguir e diz
          o motivo.
        </p>
      </div>
      {/* Container query não é usado no repositório hoje: breakpoint de viewport
          em 1240px, como a referência pede como alternativa. */}
      <CartaoRespostaMini variante="decorativa" className="hidden shrink-0 min-[1240px]:flex" />
    </section>
  );
}

const DESCRICAO_ABA: Partial<Record<string, string>> = {
  "/treino": "Pratique por tema, habilidade ou nível. A correção aparece na hora.",
  "/questoes": "Procure e resolva qualquer questão de provas anteriores.",
  "/simulados": "Monte uma prova no formato do ENEM. A correção vem só no final.",
  "/historico": "Reveja o que você respondeu, com gabarito e resolução.",
  "/desempenho": "Veja sua evolução e os assuntos em que você mais erra.",
};

function LinhaAba({ href, rotulo, desc, Icone }: { href: string; rotulo: string; desc: string; Icone: typeof Zap }) {
  return (
    <li className="border-b border-rule">
      <NextLink
        href={href}
        aria-label={`${rotulo}: ${desc}`}
        className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xs py-4 text-ink no-underline hover:bg-paper-2 motion-safe-transition sm:min-h-[4.75rem] sm:flex-nowrap sm:gap-x-6 sm:py-3.5"
      >
        <span aria-hidden="true" className="order-1 flex min-h-11 flex-1 items-center gap-3 sm:order-none sm:w-56 sm:flex-none">
          <Icone className="size-[1.625rem] shrink-0 text-brand" strokeWidth={1.75} />
          <span className="font-display text-xl font-semibold text-ink sm:text-[1.5rem]">{rotulo}</span>
        </span>
        <span aria-hidden="true" className="order-3 w-full text-base text-ink-2 sm:order-none sm:w-auto sm:flex-1">
          {desc}
        </span>
        <ChevronRight className="order-2 size-5 shrink-0 text-ink-2 sm:order-none" strokeWidth={1.75} aria-hidden="true" />
      </NextLink>
    </li>
  );
}

/** "O que cada aba faz": abas e ícones vêm da mesma lista da barra lateral; só
 *  mostra a linha cujo destino tem descrição cadastrada (ou seja, existe). */
function GuiaAbas() {
  const abas = ITENS_NAV.filter((item) => item.href !== "/inicio" && DESCRICAO_ABA[item.href]);

  return (
    <section aria-labelledby="abas-titulo" className="flex flex-col gap-3">
      <h2 id="abas-titulo" className="m-0 font-display text-[1.625rem] font-semibold text-ink sm:text-[2rem]">
        O que cada aba faz
      </h2>
      <ul className="border-t border-rule">
        {abas.map((item) => (
          <LinhaAba key={item.href} href={item.href} rotulo={item.rotulo} desc={DESCRICAO_ABA[item.href]!} Icone={item.icone} />
        ))}
      </ul>
    </section>
  );
}

const CLASSE_CARTAO = "flex min-w-0 flex-1 basis-80 flex-col gap-3.5 rounded-md border border-rule bg-card p-5 sm:p-6";

function TituloCartao({ children }: { children: React.ReactNode }) {
  return <h3 className="m-0 font-display text-[1.375rem] font-semibold leading-[1.2] text-ink sm:text-[1.5rem]">{children}</h3>;
}

/** Cartão 1 de "Seu próximo passo": atividade em andamento, senão convite a começar. */
function CartaoAtividade() {
  const router = useRouter();
  const [iniciando, setIniciando] = useState(false);

  const {
    data: atividades,
    isLoading: carregandoAtividades,
    isError: erroAtividades,
    error: erroAtividadesDetalhe,
    refetch: refazerAtividades,
  } = useQuery({ queryKey: ["atividades-em-andamento"], queryFn: () => getApi().listarAtividadesEmAndamento() });

  const {
    data: resumoGeral,
    isLoading: carregandoResumo,
    isError: erroResumo,
    error: erroResumoDetalhe,
    refetch: refazerResumo,
  } = useQuery({ queryKey: ["resumo-geral"], queryFn: () => getApi().obterResumoGeral() });

  const atividade = atividades?.[0];
  const rotaAtividade = atividade ? ROTULO_TIPO[atividade.tipo].rota(atividade.id) : null;
  const estado = estadoCartaoAtividade({
    carregando: carregandoAtividades || carregandoResumo,
    erro: erroAtividades || erroResumo,
    atividade,
    rotaAtividade,
    respondidas: resumoGeral?.respondidas,
  });

  async function comecarTreino() {
    setIniciando(true);
    // Sem "modo padrão de treino" no contrato ainda (TODO(equipe), ver
    // docs/CONTRATO_PARIDADE.md): sempre leva pra escolha de modo.
    router.push("/treino");
  }

  if (estado.tipo === "carregando") {
    return (
      <div className={CLASSE_CARTAO}>
        <Skeleton className="h-36 w-full" />
      </div>
    );
  }

  if (estado.tipo === "erro") {
    return (
      <div className={CLASSE_CARTAO}>
        <ErrorState
          mensagem={mensagemDoErro(erroAtividadesDetalhe ?? erroResumoDetalhe)}
          onTentarDeNovo={() => {
            void refazerAtividades();
            void refazerResumo();
          }}
        />
      </div>
    );
  }

  if (estado.tipo === "em-andamento") {
    const { artigo, verbo, pilula } = ROTULO_TIPO[estado.atividade.tipo];
    const rotuloProgresso = estado.atividade.area
      ? `${NOME_AREA[estado.atividade.area]}, ${estado.atividade.feitas} de ${estado.atividade.total}`
      : `${estado.atividade.feitas} de ${estado.atividade.total}`;
    const corpo = estado.atividade.area
      ? `${NOME_AREA[estado.atividade.area]}, ${estado.atividade.feitas} de ${estado.atividade.total} questões respondidas.`
      : `${estado.atividade.feitas} de ${estado.atividade.total} questões respondidas.`;

    return (
      <div className={CLASSE_CARTAO}>
        <NotaNeutra variante="rotulo" texto={pilula} />
        <TituloCartao>Termine {artigo}.</TituloCartao>
        <p className="m-0 text-base text-ink-2">{corpo}</p>
        <ProgressBar
          valor={estado.atividade.feitas}
          total={estado.atividade.total}
          rotulo={`${estado.atividade.titulo}: ${rotuloProgresso}`}
        />
        {/* Navega pra uma sessão que já existe: Link com cara de botão, não um
            botão que inicia sessão nova (esse fica "aria-busy"). */}
        <Button href={estado.rota} className="mt-auto sm:self-start">
          {verbo}
        </Button>
      </div>
    );
  }

  const contaNova = estado.tipo === "conta-nova";
  return (
    <div className={CLASSE_CARTAO}>
      <NotaNeutra variante="rotulo" texto={contaNova ? "Primeiro passo" : "Sem atividade em andamento"} />
      <TituloCartao>{contaNova ? "Comece o seu primeiro treino." : "Comece um treino."}</TituloCartao>
      <p className="m-0 text-base text-ink-2">
        {contaNova
          ? "Escolha uma área e comece. O modelo aprende com as suas respostas."
          : "Escolha como treinar: por tema, habilidade ou nível."}
      </p>
      <Button
        onClick={comecarTreino}
        carregando={iniciando}
        textoCarregando={TEXTO_PREPARANDO}
        className="mt-auto sm:self-start"
      >
        Começar treino
      </Button>
    </div>
  );
}

/** Cartão 2 de "Seu próximo passo": indicação do modelo (hoje, sem prévia). */
function CartaoProximo() {
  const router = useRouter();
  const [iniciando, setIniciando] = useState(false);

  const {
    data: reforco,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({ queryKey: ["reforco"], queryFn: () => getApi().obterReforco() });

  const estado = estadoCartaoProximo({
    carregando: isLoading,
    erro: isError,
    statusReforco: reforco?.status,
    respostasAtuais: reforco?.respostasAtuais,
    respostasMinimas: reforco?.respostasMinimas,
    // Sem prévia no contrato hoje: PedidoRecomendacao.modo não tem "auto" e
    // Reforco não carrega modelo/criterio — ver docs/CONTRATO_PARIDADE.md.
    // `previa` nunca é passado; a função já sabe escolher esse estado quando
    // o dado existir.
  });

  async function deixarModeloEscolher() {
    setIniciando(true);
    try {
      const { sessao, primeira } = await getApi().iniciarSessao({ modo: "auto" });
      salvarSessaoAtivaId(sessao.id);
      salvarFilaSessao(sessao.id, { itens: primeira.itens, aviso: primeira.aviso, modelo: primeira.modelo });
      router.push(`/treino/${sessao.id}`);
    } finally {
      setIniciando(false);
    }
  }

  if (estado.tipo === "carregando") {
    return (
      <div className={CLASSE_CARTAO}>
        <Skeleton className="h-36 w-full" />
      </div>
    );
  }

  if (estado.tipo === "erro") {
    return (
      <div className={CLASSE_CARTAO}>
        <ErrorState mensagem={mensagemDoErro(error)} onTentarDeNovo={() => refetch()} />
      </div>
    );
  }

  if (estado.tipo === "dados-insuficientes") {
    return (
      <div className={CLASSE_CARTAO}>
        <NotaNeutra variante="rotulo" texto="Dados insuficientes" />
        <TituloCartao>O modelo ainda está aprendendo com você.</TituloCartao>
        <ProgressToMinimum atual={estado.atual} minimo={estado.minimo} rotulo="indicar o que estudar" />
      </div>
    );
  }

  if (estado.tipo === "previa-modelo") {
    return (
      <div className={CLASSE_CARTAO}>
        <CriterioRecomendacao variante="rotulo" criterio={estado.criterio} />
        <TituloCartao>{estado.criterio.texto}</TituloCartao>
        <div className="flex min-h-6 flex-wrap items-center justify-between gap-2">
          <AreaTag area={estado.area} />
          <span className="font-mono text-xs text-ink-2">Versão do modelo: {estado.versaoModelo}</span>
        </div>
        <Button
          variante="vazado"
          onClick={deixarModeloEscolher}
          carregando={iniciando}
          textoCarregando={TEXTO_PREPARANDO}
          className="mt-auto sm:self-start"
        >
          Começar treino
        </Button>
      </div>
    );
  }

  // "escolha-automatica": também cobre o cenário "esgotado" — não há prévia pra
  // detectar isso antes do clique, então reaproveita o mesmo fluxo/aviso que a
  // P2 já mostra quando iniciarSessao devolve poucas questões elegíveis.
  return (
    <div className={CLASSE_CARTAO}>
      <NotaNeutra variante="rotulo" texto="Escolha automática" />
      <TituloCartao>Deixe o modelo escolher o próximo treino.</TituloCartao>
      <p className="m-0 text-base text-ink-2">Ele olha seus acertos e erros e explica o motivo da escolha.</p>
      <Button
        variante="vazado"
        onClick={deixarModeloEscolher}
        carregando={iniciando}
        textoCarregando={TEXTO_PREPARANDO}
        className="mt-auto sm:self-start"
      >
        Deixar o modelo escolher
      </Button>
    </div>
  );
}

function SeuProximoPasso() {
  return (
    <section aria-labelledby="proximo-titulo" className="flex flex-col gap-5">
      <h2 id="proximo-titulo" className="m-0 font-display text-[1.625rem] font-semibold text-ink sm:text-[2rem]">
        Seu próximo passo
      </h2>
      <div className="flex flex-wrap items-stretch gap-4">
        <CartaoAtividade />
        <CartaoProximo />
      </div>
    </section>
  );
}

function RodapeInicio() {
  return (
    <footer className="mt-auto flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t border-rule pt-5">
      <p className="m-0 text-sm text-ink-2">Gabaritei: Sistema de Auxílio para Estudo. Projeto Integrador VI.</p>
      <div className="flex gap-5">
        <Link href="/privacidade">Privacidade</Link>
        <Link href="/termos">Termos</Link>
      </div>
    </footer>
  );
}

export function InicioClient() {
  return (
    <div className="flex flex-col gap-10 sm:gap-16">
      <div {...revelar(0)}>
        <Faixa />
      </div>
      <div {...revelar(1)}>
        <GuiaAbas />
      </div>
      <div {...revelar(2)}>
        <SeuProximoPasso />
      </div>
      <div {...revelar(3)}>
        <RodapeInicio />
      </div>
    </div>
  );
}
