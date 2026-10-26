import { ApiError, type CodigoErro } from "./types";

export { ApiError };

/** Texto padrão por código de erro, para quando a tela não tem uma mensagem mais específica. */
export function mensagemPadraoDoErro(codigo: CodigoErro): string {
  switch (codigo) {
    case "nao_autenticado":
      return "Entre para continuar.";
    case "sem_permissao":
      return "Você não tem acesso a este conteúdo.";
    case "nao_encontrado":
      return "Não encontramos o que você procurava.";
    case "validacao":
      return "Alguns dados precisam ser corrigidos.";
    case "limite_excedido":
      return "Muitas tentativas. Tente de novo em alguns minutos.";
    case "indisponivel":
      return "Não conseguimos completar a ação agora. Tente de novo.";
    case "desconhecido":
    default:
      return "Algo deu errado do nosso lado. Tente de novo. Se continuar, avise a equipe.";
  }
}

export function mensagemDoErro(erro: unknown): string {
  if (erro instanceof ApiError) return erro.message || mensagemPadraoDoErro(erro.codigo);
  if (erro instanceof Error) return mensagemPadraoDoErro("desconhecido");
  return mensagemPadraoDoErro("desconhecido");
}

export function codigoDoErro(erro: unknown): CodigoErro {
  if (erro instanceof ApiError) return erro.codigo;
  return "desconhecido";
}
