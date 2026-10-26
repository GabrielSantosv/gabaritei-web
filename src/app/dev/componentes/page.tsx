"use client";

import { notFound } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Link } from "@/components/ui/link";
import { Field } from "@/components/ui/field";
import { PasswordField } from "@/components/ui/password-field";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioCardGroup, RadioCard } from "@/components/ui/radio-card";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";
import { Combobox } from "@/components/ui/combobox";
import { Dialog, DialogContent, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import { Disclosure } from "@/components/ui/disclosure";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCaption, TableHead, TableRow, TableTd, TableTh } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ProgressToMinimum } from "@/components/ui/progress-to-minimum";

import { AreaTag } from "@/components/dominio/area-tag";
import { FaixaChip } from "@/components/dominio/faixa-chip";
import { StatusChip, type StatusChipValor } from "@/components/dominio/status-chip";
import { Timer } from "@/components/dominio/timer";
import { FoguinhoBadge } from "@/components/dominio/foguinho-badge";
import { WeekStrip } from "@/components/dominio/week-strip";
import { ComboMeter } from "@/components/dominio/combo-meter";
import { CriterioRecomendacao } from "@/components/dominio/criterio-recomendacao";
import { CartaoResposta } from "@/components/dominio/cartao-resposta";
import { CartaoRespostaMini } from "@/components/dominio/cartao-resposta-mini";
import { QuestionView } from "@/components/dominio/question-view";

import { BANCO_DEMO, HABILIDADES } from "@/lib/api/mock/dados";
import { estadoInicialCombo, COMBO_CONFIG_PADRAO, reduzirCombo } from "@/lib/api/mock/engine";
import { useTema } from "@/lib/hooks/use-tema";
import type { Area, Faixa, Letra } from "@/lib/api/types";

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-12 border-t border-rule pt-8 first:border-t-0 first:pt-0">
      <h2 className="mb-4 text-xl text-ink">{titulo}</h2>
      <div className="flex flex-col gap-6">{children}</div>
    </section>
  );
}

function ThemeToggle() {
  const { tema, definirTema } = useTema();
  return (
    <Segmented
      rotulo="Tema"
      valor={tema}
      onValorChange={definirTema}
      opcoes={[
        { valor: "sistema", rotulo: "Sistema" },
        { valor: "claro", rotulo: "Claro" },
        { valor: "escuro", rotulo: "Escuro" },
      ]}
    />
  );
}

const QUESTAO_EXEMPLO = BANCO_DEMO.find((q) => q.questao.enunciado.some((b) => b.tipo === "figura" && b.figura.alt))!.questao;
const QUESTAO_COM_RESOLUCAO = BANCO_DEMO.find((q) => q.questao.temResolucao)!;

function ToastDemoButton() {
  const { mostrarToast } = useToast();
  return (
    <Button
      variante="secundario"
      onClick={() => mostrarToast({ titulo: "Lista salva", descricao: "Você pode continuar de onde parou." })}
    >
      Disparar toast
    </Button>
  );
}

export default function GaleriaComponentes() {
  const [valorField, setValorField] = useState("");
  const [valorSenha, setValorSenha] = useState("");
  const [checkbox, setCheckbox] = useState(false);
  const [switchLigado, setSwitchLigado] = useState(true);
  const [radioModo, setRadioModo] = useState("tema");
  const [paginaAtual, setPaginaAtual] = useState(3);
  const [habilidade, setHabilidade] = useState<string | null>(null);
  const [respostaResolver, setRespostaResolver] = useState<Letra | null>(null);
  const [respostaErrada, setRespostaErrada] = useState<Letra | null>("B");

  const comboBase = estadoInicialCombo(COMBO_CONFIG_PADRAO);
  const comboSubiu = reduzirCombo(reduzirCombo(reduzirCombo(comboBase, true), true), true);

  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 tabIndex={-1} className="text-3xl text-ink">
        Galeria de componentes
      </h1>
      <p className="mt-2 text-ink-2">
        Só existe em desenvolvimento (<code className="font-mono">NODE_ENV !== &quot;production&quot;</code>). Use o
        seletor de tema para conferir claro e escuro.
      </p>
      <div className="mt-4">
        <ThemeToggle />
      </div>

      <Secao titulo="Button">
        <div className="flex flex-wrap gap-3">
          <Button variante="primario">Primário</Button>
          <Button variante="secundario">Secundário</Button>
          <Button variante="discreto">Discreto</Button>
          <Button variante="perigoso">Perigoso</Button>
          <Button carregando>Carregando</Button>
          <Button disabled>Desabilitado</Button>
        </div>
        <div className="flex gap-3">
          <IconButton aria-label="Favoritar">
            <BookOpen className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </IconButton>
          <Tooltip conteudo="Mostra o texto em pt-BR">
            <IconButton aria-label="Com tooltip" variante="secundario">
              <AlertTriangle className="size-4" strokeWidth={1.75} aria-hidden="true" />
            </IconButton>
          </Tooltip>
        </div>
        <Link href="/dev/componentes">Link sempre sublinhado</Link>
      </Secao>

      <Secao titulo="Campos">
        <Field
          rotulo="E-mail"
          dica="Usamos para você entrar de novo."
          value={valorField}
          onChange={(e) => setValorField(e.target.value)}
          type="email"
          autoComplete="email"
        />
        <Field rotulo="Com erro" erro="Informe um e-mail válido." defaultValue="errado" />
        <PasswordField rotulo="Senha" value={valorSenha} onChange={(e) => setValorSenha(e.target.value)} autoComplete="new-password" />
        <Checkbox rotulo="Li e aceito os Termos e a Política de Privacidade" checked={checkbox} onCheckedChange={(v) => setCheckbox(v === true)} />
        <Switch rotulo="Abrir descrição das figuras por padrão" descricao="RF05 / RNF06" checked={switchLigado} onCheckedChange={setSwitchLigado} />
        <Combobox
          rotulo="Habilidade"
          placeholder="Buscar habilidade"
          valor={habilidade}
          onValorChange={setHabilidade}
          opcoes={HABILIDADES.slice(0, 12).map((h) => ({ valor: h.codigo, rotulo: `${h.codigo}: ${h.descricao}`, grupo: h.codigo }))}
        />
      </Secao>

      <Secao titulo="RadioCard e Segmented">
        <RadioCardGroup value={radioModo} onValueChange={setRadioModo} className="flex flex-col gap-2">
          <RadioCard value="tema" titulo="Por tema" descricao="Questões parecidas com um tema ou questão escolhida." />
          <RadioCard value="habilidade" titulo="Por habilidade" motivo="Disponível depois de 20 respostas. Faltam 14." disabled />
        </RadioCardGroup>
        <Segmented
          rotulo="Quantidade"
          valor="10"
          onValorChange={() => {}}
          opcoes={[
            { valor: "5", rotulo: "5" },
            { valor: "10", rotulo: "10" },
            { valor: "15", rotulo: "15" },
            { valor: "20", rotulo: "20" },
          ]}
        />
      </Secao>

      <Secao titulo="Dialog, Sheet, Tooltip, Toast">
        <div className="flex flex-wrap gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variante="secundario">Abrir dialog</Button>
            </DialogTrigger>
            <DialogContent titulo="Encerrar sessão?" descricao="Você respondeu 3 de 10. O que já foi respondido fica salvo.">
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variante="secundario">Continuar</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variante="perigoso">Encerrar</Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>

          <Sheet>
            <SheetTrigger asChild>
              <Button variante="secundario">Abrir sheet (filtros)</Button>
            </SheetTrigger>
            <SheetContent titulo="Filtros" descricao="3 ativos">
              <p className="text-sm text-ink-2">Conteúdo de exemplo do painel.</p>
            </SheetContent>
          </Sheet>

          <ToastDemoButton />
        </div>
      </Secao>

      <Secao titulo="Disclosure, Pagination, Table">
        <Disclosure titulo="Detalhes técnicos">
          <p className="font-mono text-sm">a: 1.24, b: 0.18, c: 0.12</p>
        </Disclosure>
        <Pagination paginaAtual={paginaAtual} totalPaginas={8} onPaginaChange={setPaginaAtual} />
        <Table>
          <TableCaption>Proficiência por área</TableCaption>
          <TableHead>
            <TableRow>
              <TableTh>Área</TableTh>
              <TableTh>Proficiência</TableTh>
              <TableTh>Tendência</TableTh>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableTd>
                <AreaTag area="MT" />
              </TableTd>
              <TableTd>0.82</TableTd>
              <TableTd>Subindo</TableTd>
            </TableRow>
          </TableBody>
        </Table>
      </Secao>

      <Secao titulo="Skeleton, EmptyState, ErrorState">
        <Skeleton className="h-6 w-48" />
        <EmptyState
          icone={BookOpen}
          titulo="Você ainda não tem listas."
          descricao="Crie uma a partir das recomendações."
          acao={<Button variante="secundario">Nova lista recomendada</Button>}
        />
        <ErrorState mensagem="Não conseguimos carregar o reforço agora." onTentarDeNovo={() => {}} />
      </Secao>

      <Secao titulo="ProgressBar e ProgressToMinimum">
        <ProgressBar valor={32} total={50} rotulo="Meta semanal" />
        <ProgressToMinimum atual={12} minimo={20} rotulo="estimar sua proficiência" />
      </Secao>

      <Secao titulo="AreaTag, FaixaChip, StatusChip">
        <div className="flex flex-wrap gap-2">
          {(["LC", "CH", "CN", "MT"] as Area[]).map((a) => (
            <AreaTag key={a} area={a} />
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          {(["facil", "media", "dificil", null] as (Faixa | null)[]).map((f, i) => (
            <FaixaChip key={i} faixa={f} />
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          {(["acertou", "errou", "em_branco", "nao_respondida", "marcada"] as StatusChipValor[]).map((s) => (
            <StatusChip key={s} status={s} />
          ))}
        </div>
      </Secao>

      <Secao titulo="Timer, Foguinho, WeekStrip">
        <Timer segundosRestantes={185} />
        <div className="flex flex-col gap-3">
          <FoguinhoBadge atual={5} melhor={9} hojeContou={true} emRisco={false} />
          <FoguinhoBadge atual={3} melhor={9} hojeContou={false} emRisco={true} />
        </div>
        <WeekStrip
          dias={Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return { data: d.toISOString().slice(0, 10), questoes: [0, 2, 8, 0, 4, 16, 1][i] };
          })}
        />
      </Secao>

      <Secao titulo="ComboMeter">
        <ComboMeter estado={comboBase} />
        <ComboMeter estado={comboSubiu} />
      </Secao>

      <Secao titulo="CriterioRecomendacao">
        <CriterioRecomendacao
          criterio={{ modo: "habilidade", texto: "Mesma habilidade (H21) em que você acertou 38 %.", area: "MT", habilidade: "H21" }}
          versaoModelo="0.0.0"
        />
      </Secao>

      <Secao titulo="CartaoResposta e CartaoRespostaMini">
        <CartaoResposta
          hrefBase={(n) => `/dev/componentes#questao-${n}`}
          itens={Array.from({ length: 45 }, (_, i) => {
            const letras: Letra[] = ["A", "B", "C", "D", "E"];
            const gabarito = letras[i % 5];
            const emBranco = i % 11 === 0;
            const resposta = emBranco ? null : letras[(i + (i % 3)) % 5];
            return { n: i + 1, resposta, gabarito, correta: resposta === gabarito, marcada: i % 7 === 0 };
          })}
        />
        <CartaoRespostaMini
          variante="treino"
          atual={4}
          itens={Array.from({ length: 10 }, (_, i) => ({ n: i + 1, letra: i < 3 ? (["A", "B", "C"] as Letra[])[i] : null }))}
        />
        <CartaoRespostaMini
          variante="simulado"
          atual={5}
          onSelecionar={() => {}}
          itens={Array.from({ length: 12 }, (_, i) => ({ n: i + 1, resposta: i < 4 ? "A" : null, marcada: i === 6 }))}
        />
      </Secao>

      <Secao titulo="QuestionView: resolver">
        <QuestionView
          questao={QUESTAO_EXEMPLO}
          modo="resolver"
          respostaSelecionada={respostaResolver}
          onRespostaChange={setRespostaResolver}
          onEnviar={() => {}}
          descricaoImagensAbertaPorPadrao={false}
        />
      </Secao>

      <Secao titulo="QuestionView: correção (errou)">
        <QuestionView
          questao={QUESTAO_COM_RESOLUCAO.questao}
          modo="correcao"
          respostaSelecionada={respostaErrada}
          onRespostaChange={setRespostaErrada}
          correcao={{
            tentativaId: "demo",
            correta: respostaErrada === QUESTAO_COM_RESOLUCAO.gabarito,
            gabarito: QUESTAO_COM_RESOLUCAO.gabarito,
            resolucao: QUESTAO_COM_RESOLUCAO.resolucao,
            respondidaEm: new Date().toISOString(),
          }}
        />
      </Secao>

      <Secao titulo="QuestionView: revisão (sem resolução cadastrada)">
        <QuestionView
          questao={BANCO_DEMO.find((q) => !q.questao.temResolucao)!.questao}
          modo="revisao"
          respostaSelecionada="A"
          correcao={{
            tentativaId: "demo-2",
            correta: false,
            gabarito: "C",
            resolucao: null,
            respondidaEm: new Date().toISOString(),
          }}
        />
      </Secao>
    </main>
  );
}
