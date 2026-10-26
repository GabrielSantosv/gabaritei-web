/** Datas, números e unidades em pt-BR (seção 4 e 6 do prompt). */

const NBSP = " ";

export function formatarData(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(iso));
}

export function formatarDataHora(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(iso),
  );
}

export function formatarHora(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(new Date(iso));
}

export function formatarNumero(valor: number): string {
  return new Intl.NumberFormat("pt-BR").format(valor);
}

export function formatarPercentual(valor: number, fracao = 0): string {
  const texto = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: fracao,
    minimumFractionDigits: fracao,
  }).format(valor);
  return `${texto}${NBSP}%`;
}

/** "2 h 49 min" ou "43 min" ou "38 s", com espaço sem quebra entre número e unidade. */
export function formatarDuracao(segundosTotais: number): string {
  const segundos = Math.max(0, Math.round(segundosTotais));
  const h = Math.floor(segundos / 3600);
  const min = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;

  if (h > 0) return `${h}${NBSP}h${NBSP}${min}${NBSP}min`;
  if (min > 0) return `${min}${NBSP}min${s > 0 ? ` ${s}${NBSP}s` : ""}`;
  return `${s}${NBSP}s`;
}

/** Para o Timer: "23:45" ou "1:02:03" */
export function formatarCronometro(segundosTotais: number): string {
  const segundos = Math.max(0, Math.round(segundosTotais));
  const h = Math.floor(segundos / 3600);
  const min = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  const mm = String(min).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** "há 2 horas" / "há 5 min" / "agora" (P2, "Continue de onde parou"). */
export function formatarTempoRelativo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "agora";
  const formatador = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
  if (diffMin < 60) return formatador.format(-diffMin, "minute");
  const diffHoras = Math.round(diffMin / 60);
  if (diffHoras < 24) return formatador.format(-diffHoras, "hour");
  const diffDias = Math.round(diffHoras / 24);
  return formatador.format(-diffDias, "day");
}

export function comEspacoSemQuebra(numero: number | string, unidade: string): string {
  return `${numero}${NBSP}${unidade}`;
}

/** Trunca num espaço antes do limite (nunca no meio de uma palavra) e acrescenta "…". */
export function truncarNaPalavra(texto: string, maxCaracteres: number): string {
  if (texto.length <= maxCaracteres) return texto;
  const cortado = texto.slice(0, maxCaracteres);
  const ultimoEspaco = cortado.lastIndexOf(" ");
  return `${(ultimoEspaco > 0 ? cortado.slice(0, ultimoEspaco) : cortado).trimEnd()}…`;
}
