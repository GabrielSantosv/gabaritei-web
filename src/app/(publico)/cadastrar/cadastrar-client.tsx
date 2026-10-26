"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { FormErrorSummary } from "@/components/ui/form-error-summary";
import { Link } from "@/components/ui/link";
import { PasswordField } from "@/components/ui/password-field";
import { RadioCard, RadioCardGroup } from "@/components/ui/radio-card";
import { getApi } from "@/lib/api/client";
import { ApiError, codigoDoErro } from "@/lib/api/errors";
import { destinoPosEntrada } from "@/lib/rota-segura";
import type { Perfil } from "@/lib/api/types";

const esquema = z.object({
  nome: z.string().min(1, "Informe como quer ser chamado."),
  email: z.string().min(1, "Informe seu e-mail.").email("Informe um e-mail válido."),
  senha: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres."),
  faixaEtaria: z.enum(["maior_18", "menor_18"], {
    error: () => "Selecione uma opção.",
  }),
  aceiteTermos: z.boolean().refine((v) => v === true, {
    message: "Você precisa aceitar os Termos e a Política de Privacidade.",
  }),
});
type FormValues = z.infer<typeof esquema>;

const COOLDOWN_REENVIO_SEGUNDOS = 30;

function ConfirmeEmail({ perfil }: { perfil: Perfil }) {
  const router = useRouter();
  const [restante, setRestante] = useState(COOLDOWN_REENVIO_SEGUNDOS);

  useEffect(() => {
    if (restante <= 0) return;
    const id = setTimeout(() => setRestante((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [restante]);

  return (
    <div className="mx-auto max-w-md py-4 lg:py-12">
      <h1 tabIndex={-1} className="text-2xl text-ink">
        Confira seu e-mail
      </h1>
      <p className="mt-3 text-ink-2">
        Enviamos um link de confirmação para <strong className="text-ink">{perfil.email}</strong>. Abra o link para
        ativar sua conta.
      </p>
      <p className="mt-3 rounded-r-xs border-l-[3px] border-l-rule-strong bg-paper-2 p-3 text-sm text-ink-2">
        Modo de demonstração: nenhum e-mail é enviado de verdade.
      </p>

      <Button
        variante="secundario"
        className="mt-6"
        disabled={restante > 0}
        onClick={() => setRestante(COOLDOWN_REENVIO_SEGUNDOS)}
      >
        {restante > 0 ? `Reenviar e-mail (${restante}s)` : "Reenviar e-mail"}
      </Button>

      <div className="mt-8 border-t border-rule pt-6">
        <Button onClick={() => router.push(destinoPosEntrada(perfil.onboardingConcluido))}>
          Já confirmei, continuar
        </Button>
      </div>
    </div>
  );
}

export function CadastrarClient() {
  const resumoRef = useRef<HTMLDivElement>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [emailEmUso, setEmailEmUso] = useState(false);
  const [perfilCriado, setPerfilCriado] = useState<Perfil | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(esquema),
    defaultValues: { aceiteTermos: false },
  });

  useEffect(() => {
    if (erroGeral) resumoRef.current?.focus();
  }, [erroGeral]);

  async function aoSubmeter(valores: FormValues) {
    setErroGeral(null);
    setEmailEmUso(false);
    try {
      const perfil = await getApi().cadastrar({
        nome: valores.nome,
        email: valores.email,
        senha: valores.senha,
        faixaEtaria: valores.faixaEtaria,
      });
      setPerfilCriado(perfil);
    } catch (erro) {
      const codigo = codigoDoErro(erro);
      if (codigo === "indisponivel") {
        setErroGeral("Não conseguimos conectar agora. Verifique sua internet e tente de novo.");
      } else {
        const detalhes = erro instanceof ApiError ? (erro.detalhes as { tipo?: string } | undefined) : undefined;
        if (detalhes?.tipo === "email_em_uso") setEmailEmUso(true);
        setErroGeral(erro instanceof Error ? erro.message : "Não foi possível criar sua conta. Tente de novo.");
      }
    }
  }

  if (perfilCriado) return <ConfirmeEmail perfil={perfilCriado} />;

  return (
    <div className="mx-auto max-w-lg py-4 lg:py-12">
      <h1 tabIndex={-1} className="text-2xl text-ink">
        Criar conta
      </h1>

      {erroGeral ? (
        <FormErrorSummary ref={resumoRef} titulo="Não foi possível criar sua conta" mensagem={erroGeral} className="mt-4">
          {emailEmUso ? (
            <p className="mt-2 text-sm">
              <Link href="/entrar">Entrar com essa conta</Link>
            </p>
          ) : null}
        </FormErrorSummary>
      ) : null}

      <form onSubmit={handleSubmit(aoSubmeter)} noValidate className="mt-6 flex flex-col gap-5">
        <Field {...register("nome")} id="nome" rotulo="Como quer ser chamado" autoComplete="name" erro={errors.nome?.message} />
        <Field
          {...register("email")}
          id="email"
          rotulo="E-mail"
          type="email"
          autoComplete="email"
          erro={errors.email?.message}
        />
        <PasswordField
          {...register("senha")}
          id="senha"
          rotulo="Senha"
          dica="Pelo menos 6 caracteres."
          autoComplete="new-password"
          erro={errors.senha?.message}
        />

        <div>
          <p className="text-sm font-medium text-ink">Sua idade</p>
          <Controller
            control={control}
            name="faixaEtaria"
            render={({ field }) => (
              <RadioCardGroup value={field.value} onValueChange={field.onChange} className="mt-2 flex flex-col gap-2">
                <RadioCard value="maior_18" titulo="Tenho 18 anos ou mais" />
                <RadioCard value="menor_18" titulo="Tenho menos de 18 anos" />
              </RadioCardGroup>
            )}
          />
          {errors.faixaEtaria ? <p className="mt-1.5 text-sm text-err">{errors.faixaEtaria.message}</p> : null}
        </div>

        <div>
          <Controller
            control={control}
            name="aceiteTermos"
            render={({ field }) => (
              <Checkbox
                id="aceiteTermos"
                checked={field.value}
                onCheckedChange={(v) => field.onChange(v === true)}
                rotulo={
                  <>
                    Li e aceito os <Link href="/termos">Termos</Link> e a <Link href="/privacidade">Política de
                    Privacidade</Link>.
                  </>
                }
              />
            )}
          />
          {errors.aceiteTermos ? <p className="mt-1.5 text-sm text-err">{errors.aceiteTermos.message}</p> : null}
        </div>

        <p className="text-sm text-ink-2">
          Suas respostas, sem identificação, ajudam a avaliar e melhorar as recomendações. Para excluir sua conta,
          fale com a equipe em{" "}
          <span className="font-mono text-xs">TODO(equipe): e-mail de contato</span>.
        </p>

        <Button type="submit" carregando={isSubmitting} textoCarregando="Criando conta">
          Criar conta
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink-2">
        Já tem conta? <Link href="/entrar">Entrar</Link>
      </p>
    </div>
  );
}
