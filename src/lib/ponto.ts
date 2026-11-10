export type TipoMarcacao = "entrada" | "saida_intervalo" | "retorno_intervalo" | "saida";
export type Motivo =
  | "esquecimento"
  | "falha_sistema"
  | "conexao"
  | "dispositivo"
  | "atividade_externa"
  | "outro";
export type StatusSolicitacao = "pendente" | "aprovado" | "rejeitado";

export const TIPOS: TipoMarcacao[] = ["entrada", "saida_intervalo", "retorno_intervalo", "saida"];

export const TIPO_LABEL: Record<TipoMarcacao, string> = {
  entrada: "Entrada",
  saida_intervalo: "Saída para intervalo",
  retorno_intervalo: "Retorno do intervalo",
  saida: "Saída",
};

export const MOTIVO_LABEL: Record<Motivo, string> = {
  esquecimento: "Esquecimento",
  falha_sistema: "Falha no aplicativo ou sistema",
  conexao: "Problema de conexão com a internet",
  dispositivo: "Problema no dispositivo",
  atividade_externa: "Atividade externa",
  outro: "Outro",
};

export const STATUS_LABEL: Record<StatusSolicitacao, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
};

export interface MarcacaoLite {
  user_id: string;
  tipo: TipoMarcacao;
  data_local: string;
  momento_dispositivo: string;
}

export interface Regras {
  jornada_diaria_min: number;
  tolerancia_min: number;
  limite_diario_min: number;
  validade_banco_dias: number;
}

/** Next punch type for the day, or null when the four are done. */
export function proximoTipo(feitas: TipoMarcacao[]): TipoMarcacao | null {
  return TIPOS.find((t) => !feitas.includes(t)) ?? null;
}

/** Captures the device's local date/time at the instant of the call. */
export function capturarMomentoLocal(now: Date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    momento_dispositivo: now.toISOString(),
    data_local: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    hora_local: `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
    tz_offset_min: -now.getTimezoneOffset(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? null,
  };
}

export function dataLocalHoje(now: Date = new Date()) {
  return capturarMomentoLocal(now).data_local;
}

/** Worked minutes in a day from its punches (only closed intervals count). */
export function minutosTrabalhados(dia: MarcacaoLite[]): number {
  const t = (tipo: TipoMarcacao) => {
    const m = dia.find((x) => x.tipo === tipo);
    return m ? new Date(m.momento_dispositivo).getTime() : null;
  };
  const e = t("entrada"), si = t("saida_intervalo"), ri = t("retorno_intervalo"), s = t("saida");
  let total = 0;
  if (e !== null && si !== null) total += si - e;
  else if (e !== null && s !== null && ri === null) total += s - e;
  if (ri !== null && s !== null) total += s - ri;
  return Math.max(0, Math.round(total / 60000));
}

export function jornadaCompleta(dia: MarcacaoLite[]) {
  return TIPOS.every((t) => dia.some((m) => m.tipo === t));
}

/** Daily balance: only days with a final "saida" count; differences within tolerance are zero. */
export function saldoDia(dia: MarcacaoLite[], regras: Regras): number {
  if (!dia.some((m) => m.tipo === "saida")) return 0;
  const diff = minutosTrabalhados(dia) - regras.jornada_diaria_min;
  return Math.abs(diff) <= regras.tolerancia_min ? 0 : diff;
}

export function agruparPorDia(marcacoes: MarcacaoLite[]) {
  const map = new Map<string, MarcacaoLite[]>();
  for (const m of marcacoes) {
    const k = `${m.user_id}|${m.data_local}`;
    map.set(k, [...(map.get(k) ?? []), m]);
  }
  return map;
}

/** Hour-bank balance from recorded punches only (pending requests never enter here). */
export function saldoBanco(marcacoes: MarcacaoLite[], regras: Regras): number {
  let total = 0;
  for (const dia of agruparPorDia(marcacoes).values()) total += saldoDia(dia, regras);
  return total;
}

export function formatarMinutos(min: number, comSinal = true) {
  const sinal = min < 0 ? "-" : comSinal ? "+" : "";
  const a = Math.abs(min);
  return `${sinal}${Math.floor(a / 60)}h${String(a % 60).padStart(2, "0")}`;
}

export function formatarHora(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function formatarData(d: string) {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

export interface SolicitacaoInput {
  data_solicitada: string;
  hora_solicitada: string;
  tipo: string;
  motivo: string;
  observacao?: string;
}

/** Validates the adjustment form; returns field → message. */
export type ErrosSolicitacao = Partial<Record<keyof SolicitacaoInput, string>>;
export function validarSolicitacao(v: SolicitacaoInput, hoje: string): ErrosSolicitacao {
  const e: ErrosSolicitacao = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.data_solicitada) || isNaN(Date.parse(v.data_solicitada)))
    e.data_solicitada = "Informe uma data válida.";
  else if (v.data_solicitada > hoje) e.data_solicitada = "A data não pode estar no futuro.";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(v.hora_solicitada)) e.hora_solicitada = "Informe um horário válido.";
  if (!TIPOS.includes(v.tipo as TipoMarcacao)) e.tipo = "Selecione o tipo de marcação.";
  if (!(v.motivo in MOTIVO_LABEL)) e.motivo = "Selecione o motivo.";
  if ((v.observacao ?? "").length > 1000) e.observacao = "Máximo de 1000 caracteres.";
  return e;
}
