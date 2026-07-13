import { sql } from "../db";
import type { HistoryEntry, Lead } from "../types";
import { normalizeStatus } from "../domain";

/**
 * Camada de acesso a dados dos leads. Isola toda a interação SQL com o
 * Postgres (Neon) e converte entre colunas snake_case e o domínio camelCase.
 */

/** Mapa domínio -> coluna. Também serve de whitelist para updates dinâmicos. */
const COLUMN_MAP = {
  empresa: "empresa",
  cidade: "cidade",
  segmento: "segmento",
  prioridade: "prioridade",
  tipoContato: "tipo_contato",
  contato: "contato",
  whatsapp: "whatsapp",
  contato2: "contato2",
  whatsapp2: "whatsapp2",
  instagram: "instagram",
  site: "site",
  temSite: "tem_site",
  email: "email",
  endereco: "endereco",
  situacao: "situacao",
  oportunidade: "oportunidade",
  status: "status",
  ultimoContato: "ultimo_contato",
  followUp: "follow_up",
  responsavel: "responsavel",
  valor: "valor",
  obs: "obs",
  fonteContato: "fonte_contato",
  fontePresenca: "fonte_presenca",
  verificadoEm: "verificado_em",
  mensagem: "mensagem",
} as const;

export type LeadField = keyof typeof COLUMN_MAP;

/** Colunas selecionadas com datas e valor já normalizados para o cliente. */
const SELECT_COLS = `
  id, empresa, cidade, segmento, prioridade,
  tipo_contato AS "tipoContato", contato, whatsapp,
  contato2, whatsapp2, instagram, site,
  tem_site AS "temSite", email, endereco, situacao, oportunidade, status,
  ultimo_contato::text AS "ultimoContato",
  follow_up::text AS "followUp",
  responsavel, valor, obs,
  fonte_contato AS "fonteContato",
  fonte_presenca AS "fontePresenca",
  verificado_em::text AS "verificadoEm",
  mensagem
`;

type Row = Record<string, unknown>;

function mapRow(row: Row, historico: HistoryEntry[]): Lead {
  return {
    ...(row as unknown as Omit<Lead, "valor" | "historico">),
    valor: row.valor != null ? Number(row.valor) : null,
    historico,
  };
}

async function historyByLead(): Promise<Map<number, HistoryEntry[]>> {
  const rows = (await sql`
    SELECT id, lead_id, texto, criado_em::text AS "criadoEm"
    FROM lead_history
    ORDER BY criado_em DESC, id DESC
  `) as Row[];
  const map = new Map<number, HistoryEntry[]>();
  for (const r of rows) {
    const leadId = r.lead_id as number;
    const entry: HistoryEntry = {
      id: r.id as number,
      texto: r.texto as string,
      criadoEm: r.criadoEm as string,
    };
    const list = map.get(leadId);
    if (list) list.push(entry);
    else map.set(leadId, [entry]);
  }
  return map;
}

export async function getAllLeads(): Promise<Lead[]> {
  const [rows, history] = await Promise.all([
    sql`SELECT ${sql.unsafe(SELECT_COLS)} FROM leads ORDER BY id ASC` as Promise<
      Row[]
    >,
    historyByLead(),
  ]);
  return rows.map((r) => mapRow(r, history.get(r.id as number) ?? []));
}

export async function getLead(id: number): Promise<Lead | null> {
  const rows = (await sql`
    SELECT ${sql.unsafe(SELECT_COLS)} FROM leads WHERE id = ${id}
  `) as Row[];
  if (rows.length === 0) return null;
  const hist = (await sql`
    SELECT id, texto, criado_em::text AS "criadoEm"
    FROM lead_history WHERE lead_id = ${id}
    ORDER BY criado_em DESC, id DESC
  `) as Row[];
  return mapRow(
    rows[0],
    hist.map((h) => ({
      id: h.id as number,
      texto: h.texto as string,
      criadoEm: h.criadoEm as string,
    }))
  );
}

export async function addHistory(leadId: number, texto: string): Promise<void> {
  await sql`INSERT INTO lead_history (lead_id, texto) VALUES (${leadId}, ${texto})`;
}

/**
 * Atualiza um subconjunto de campos de um lead. Somente colunas presentes
 * na whitelist são aceitas; usa query parametrizada para evitar injeção.
 */
export async function updateLeadFields(
  id: number,
  fields: Partial<Record<LeadField, unknown>>
): Promise<void> {
  const entries = Object.entries(fields).filter(([k]) => k in COLUMN_MAP);
  if (entries.length === 0) return;

  const sets: string[] = [];
  const params: unknown[] = [];
  entries.forEach(([key, value], i) => {
    sets.push(`${COLUMN_MAP[key as LeadField]} = $${i + 1}`);
    params.push(value === undefined ? null : value);
  });
  params.push(id);

  await sql.query(
    `UPDATE leads SET ${sets.join(", ")}, updated_at = now() WHERE id = $${
      params.length
    }`,
    params
  );
}

export async function createLead(
  fields: Partial<Record<LeadField, unknown>>
): Promise<number> {
  const entries = Object.entries(fields).filter(([k]) => k in COLUMN_MAP);
  const cols = entries.map(([k]) => COLUMN_MAP[k as LeadField]);
  const placeholders = entries.map((_, i) => `$${i + 1}`);
  const params = entries.map(([, v]) => (v === undefined ? null : v));

  const rows = (await sql.query(
    `INSERT INTO leads (${cols.join(", ")}) VALUES (${placeholders.join(
      ", "
    )}) RETURNING id`,
    params
  )) as Row[];
  return rows[0].id as number;
}

export async function deleteLead(id: number): Promise<void> {
  await sql`DELETE FROM leads WHERE id = ${id}`;
}

/** Sanitiza um status vindo do exterior antes de gravar. */
export { normalizeStatus };
