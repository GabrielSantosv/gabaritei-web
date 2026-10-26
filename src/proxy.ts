import { NextResponse, type NextRequest } from "next/server";

/**
 * Protege as rotas do grupo (app) (seção 8): sem sessão, redireciona para
 * /entrar com ?proxima= para voltar depois do login.
 *
 * TODO(equipe): isto lê o cookie da sessão falsa do mock
 * (`gabaritei:mock:sessao`, ver lib/api/mock/estado.ts). Quando o Supabase
 * Auth entrar (http mode), trocar pela checagem do cookie/sessão real dele.
 */
const ROTAS_PROTEGIDAS = [
  "/boas-vindas",
  "/inicio",
  "/treino",
  "/questoes",
  "/simulados",
  "/historico",
  "/perfil",
  "/configuracoes",
];

export function proxy(request: NextRequest) {
  const protegida = ROTAS_PROTEGIDAS.some(
    (rota) => request.nextUrl.pathname === rota || request.nextUrl.pathname.startsWith(`${rota}/`),
  );
  if (!protegida) return NextResponse.next();

  const autenticado = request.cookies.get("gabaritei:mock:sessao")?.value === "1";
  if (autenticado) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/entrar";
  url.search = "";
  url.searchParams.set("proxima", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/boas-vindas/:path*",
    "/inicio/:path*",
    "/treino/:path*",
    "/questoes/:path*",
    "/simulados/:path*",
    "/historico/:path*",
    "/perfil/:path*",
    "/configuracoes/:path*",
  ],
};
