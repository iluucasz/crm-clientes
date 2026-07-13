import type { Prioridade } from "./types";

/**
 * Configuração central dos status do funil.
 * - `fuDays`: dias sugeridos para o próximo follow-up ao entrar no status.
 * - `stage`: posição no funil de conversão (usado nos gráficos).
 */
export interface StatusConfig {
  id: string;
  color: string;
  fuDays: number | null;
  stage: number;
}

export const STATUSES: StatusConfig[] = [
  { id: "Novo", color: "#64748b", fuDays: null, stage: 0 },
  { id: "Contato enviado", color: "#3b82f6", fuDays: 3, stage: 1 },
  { id: "Respondeu", color: "#2aa8c4", fuDays: 1, stage: 2 },
  { id: "Interessado", color: "#8b5cf6", fuDays: 2, stage: 3 },
  { id: "Orçamento enviado", color: "#d4a017", fuDays: 3, stage: 4 },
  { id: "Fechado", color: "#2eb872", fuDays: null, stage: 5 },
  { id: "Orçamento recusado", color: "#e8763a", fuDays: null, stage: 4 },
  { id: "Desinteressado", color: "#d94f4f", fuDays: null, stage: 2 },
  { id: "Sem resposta", color: "#7c8494", fuDays: null, stage: 1 },
];

/** Status que encerram o ciclo ativo (não geram follow-up). */
export const CLOSED = [
  "Fechado",
  "Orçamento recusado",
  "Desinteressado",
  "Sem resposta",
];

/** Renomeações de status legados vindos de planilhas/backups antigos. */
export const MIGRATE: Record<string, string> = {
  "Contato respondeu": "Respondeu",
  Negociando: "Interessado",
  "Proposta enviada": "Orçamento enviado",
  Perdido: "Desinteressado",
};

export const PRIORIDADES: Prioridade[] = [
  "Muito alta",
  "Alta",
  "Média",
  "Baixa",
];

export const PRIO_COLORS: Record<string, string> = {
  "Muito alta": "#d94f4f",
  Alta: "#e8763a",
  Média: "#d4a017",
  Baixa: "#64748b",
};

export const PRIO_ORDER: Record<string, number> = {
  "Muito alta": 0,
  Alta: 1,
  Média: 2,
  Baixa: 3,
};

export function statusConfig(status: string): StatusConfig {
  return STATUSES.find((s) => s.id === status) ?? STATUSES[0];
}

export function stColor(status: string): string {
  return statusConfig(status).color;
}

/** Normaliza um status desconhecido/legado para um válido. */
export function normalizeStatus(status: string | null | undefined): string {
  if (!status) return "Novo";
  const migrated = MIGRATE[status] ?? status;
  return STATUSES.some((s) => s.id === migrated) ? migrated : "Novo";
}
