"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { CartaoRespostaDecorativo } from "@/components/dominio/cartao-resposta-decorativo";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormErrorSummary } from "@/components/ui/form-error-summary";
import { Link } from "@/components/ui/link";
import { PasswordField } from "@/components/ui/password-field";
import { getApi } from "@/lib/api/client";
import { codigoDoErro } from "@/lib/api/errors";
import { destinoPosEntrada } from "@/lib/rota-segura";

const esquema = z.object({
  email: z.string().min(1, "Informe seu e-mail.").email("Informe um e-mail válido."),
  senha: z.string().min(1, "Informe sua senha."),
});
type FormValues = z.infer<typeof esquema>;

const LIMITE_TENTATIVAS = 3;
const COOLDOWN_MS = 30_000;

function FormularioEntrar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumoRef = useRef<HTMLDivElement>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [tentativasFalhas, setTentativasFalhas] = useState(0);
  const [bloqueado, setBloqueado] = useState(false);
  const [verificandoSessao, setVerificandoSessao] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(esquema) });

  useEffect(() => {
    let ativo = true;
    getApi()
      .obterUsuarioAtual()
      .then((usuario) => {
        if (!ativo) return;
        if (usuario) {
          router.replace(destinoPosEntrada(usuario.onboardingConcluido, searchParams.get("proxima")));
        } else {
          setVerificandoSessao(false);
        }
      });
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (erroGeral) resumoRef.current?.focus();
  }, [erroGeral]);

  // Cooldown do bloqueio por muitas tentativas: estado + timer, sem comparar
  // Date.now() durante a renderização (react-hooks/purity).
  useEffect(() => {
    if (!bloqueado) return;
    const id = setTimeout(() => {
      setBloqueado(false);
      setTentativasFalhas(0);
    }, COOLDOWN_MS);
    return () => clearTimeout(id);
  }, [bloqueado]);

  async function aoSubmeter(valores: FormValues) {
    if (bloqueado) return;
    setErroGeral(null);
    try {
      const perfil = await getApi().entrar(valores);
      setTentativasFalhas(0);
      router.push(destinoPosEntrada(perfil.onboardingConcluido, searchParams.get("proxima")));
    } catch (erro) {
      const codigo = codigoDoErro(erro);
      const novasTentativas = tentativasFalhas + 1;
      setTentativasFalhas(novasTentativas);

      if (novasTentativas >= LIMITE_TENTATIVAS) {
        setBloqueado(true);
        setErroGeral("Muitas tentativas. Tente de novo em alguns minutos.");
      } else if (codigo === "indisponivel") {
        setErroGeral("Não conseguimos conectar agora. Verifique sua internet e tente de novo.");
      } else {
        setErroGeral("E-mail ou senha incorretos. Confira os dados e tente de novo.");
      }
    }
  }

  if (verificandoSessao) return null;

  return (
    <div className="mx-auto grid max-w-4xl gap-10 py-4 lg:grid-cols-2 lg:items-center lg:py-12">
      <div>
        <h1 tabIndex={-1} className="text-2xl text-ink">
          Entrar no Gabaritei
        </h1>

        {erroGeral ? (
          <FormErrorSummary ref={resumoRef} titulo="Não foi possível entrar" mensagem={erroGeral} className="mt-4" />
        ) : null}

        <form onSubmit={handleSubmit(aoSubmeter)} noValidate className="mt-6 flex flex-col gap-4">
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
            autoComplete="current-password"
            erro={errors.senha?.message}
          />
          <Button type="submit" carregando={isSubmitting} textoCarregando="Entrando" disabled={bloqueado}>
            Entrar
          </Button>
        </form>

        <p className="mt-6 text-sm text-ink-2">
          Ainda não tem conta? <Link href="/cadastrar">Criar conta</Link>
        </p>
      </div>

      <div className="hidden rounded-md bg-paper-2 p-8 lg:block">
        <p className="font-display text-xl text-ink">Questões do ENEM, recomendadas com critério.</p>
        <p className="mt-2 text-sm text-ink-2">O Gabaritei sempre mostra por que recomendou cada questão.</p>
        <CartaoRespostaDecorativo className="mt-6" />
      </div>
    </div>
  );
}

export function EntrarClient() {
  return (
    <Suspense fallback={null}>
      <FormularioEntrar />
    </Suspense>
  );
}
