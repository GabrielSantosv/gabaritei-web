"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getApi } from "@/lib/api/client";

/** Sem landing page pública (seção 8): / redireciona para /inicio (logado) ou /entrar. */
export default function RaizPage() {
  const router = useRouter();

  useEffect(() => {
    getApi()
      .obterUsuarioAtual()
      .then((usuario) => router.replace(usuario ? "/inicio" : "/entrar"))
      .catch(() => router.replace("/entrar"));
  }, [router]);

  return null;
}
