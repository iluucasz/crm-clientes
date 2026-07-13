/** Entrada do histórico automático de um lead. */
export interface HistoryEntry {
  id: number;
  texto: string;
  /** ISO timestamp (UTC) de quando o evento foi registrado. */
  criadoEm: string;
}

/**
 * Representa um lead do CRM. Os nomes seguem o domínio original em
 * português; a camada de repositório converte de/para as colunas
 * snake_case do banco.
 */
export interface Lead {
  id: number;
  empresa: string;
  cidade: string | null;
  segmento: string | null;
  prioridade: Prioridade | null;
  tipoContato: string | null;
  contato: string | null;
  whatsapp: string | null;
  contato2: string | null;
  whatsapp2: string | null;
  instagram: string | null;
  site: string | null;
  temSite: string | null;
  email: string | null;
  endereco: string | null;
  situacao: string | null;
  oportunidade: string | null;
  status: string;
  /** Datas em formato ISO `YYYY-MM-DD`. */
  ultimoContato: string | null;
  followUp: string | null;
  responsavel: string | null;
  valor: number | null;
  obs: string | null;
  fonteContato: string | null;
  fontePresenca: string | null;
  verificadoEm: string | null;
  mensagem: string | null;
  /** Texto de oferta/proposta (valores e como funciona) enviado ao cliente. */
  oferta: string | null;
  historico: HistoryEntry[];
}

export type Prioridade = "Muito alta" | "Alta" | "Média" | "Baixa";

/** Payload aceito para criar um novo lead manualmente. */
export interface NewLeadInput {
  empresa: string;
  cidade?: string;
  segmento?: string;
  prioridade?: Prioridade;
  contato?: string;
  contato2?: string;
  instagram?: string;
  site?: string;
  temSite?: string;
  obs?: string;
}
