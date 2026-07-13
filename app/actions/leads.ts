"use server";

import {
  addHistory,
  createLead as repoCreateLead,
  deleteLead as repoDeleteLead,
  getAllLeads,
  getLead,
  normalizeStatus,
  updateLeadFields,
  type LeadField,
} from "@/lib/repository/leads";
import { CLOSED, statusConfig } from "@/lib/domain";
import { addDays, brl, fmtBR, phoneLink, today } from "@/lib/format";
import type { Lead, NewLeadInput } from "@/lib/types";

/**
 * Server Actions do CRM. Concentram toda a lógica de automação (mudança de
 * status, follow-ups sugeridos, histórico) e persistem no Postgres.
 * Cada ação devolve o lead atualizado para que o cliente reconcilie o estado.
 *
 * O cliente aplica atualização otimista e reconcilia com o retorno destas
 * ações, então NÃO usamos `revalidatePath` aqui — revalidar rebuscaria todos
 * os leads do banco a cada clique, causando lentidão perceptível. A página é
 * `force-dynamic` e busca dados frescos em cada carregamento completo.
 */

async function withRefresh<T>(fn: () => Promise<T>): Promise<T> {
  return fn();
}

/** Lista completa — usada em refetch/backup. */
export async function listLeads(): Promise<Lead[]> {
  return getAllLeads();
}

/**
 * Automação central: alterar o status registra o contato de hoje e sugere o
 * próximo follow-up conforme a configuração do status.
 */
export async function setStatus(id: number, newStatus: string): Promise<Lead | null> {
  return withRefresh(async () => {
    const lead = await getLead(id);
    if (!lead) return null;
    const status = normalizeStatus(newStatus);
    if (lead.status === status) return lead;

    const cfg = statusConfig(status);
    const fields: Partial<Record<LeadField, unknown>> = {
      status,
      ultimoContato: today(),
    };
    let followUp: string | null = lead.followUp;
    if (cfg.fuDays != null) {
      followUp = addDays(today(), cfg.fuDays);
      fields.followUp = followUp;
    } else if (CLOSED.includes(status)) {
      followUp = null;
      fields.followUp = null;
    }

    await updateLeadFields(id, fields);
    const extra =
      cfg.fuDays != null ? ` · follow-up em ${fmtBR(followUp)}` : "";
    await addHistory(id, `Status: ${lead.status || "—"} → ${status}${extra}`);
    return getLead(id);
  });
}

/** Atualiza um campo simples, com histórico específico para valor/follow-up. */
export async function setField(
  id: number,
  field: LeadField,
  rawValue: string | number | null
): Promise<Lead | null> {
  return withRefresh(async () => {
    const lead = await getLead(id);
    if (!lead) return null;

    let value: string | number | null = rawValue;
    if (field === "valor") {
      value = rawValue === "" || rawValue == null ? null : Number(rawValue) || null;
      if (value && value !== lead.valor) {
        await addHistory(id, `Orçamento definido: ${brl(value as number)}`);
      }
    } else if (typeof value === "string") {
      value = value.trim() || null;
    }

    await updateLeadFields(id, { [field]: value });
    if (field === "followUp" && value) {
      await addHistory(id, `Follow-up ajustado para ${fmtBR(value as string)}`);
    }
    return getLead(id);
  });
}

/** Atualiza um telefone e regenera o link do WhatsApp correspondente. */
export async function setPhone(
  id: number,
  which: 1 | 2,
  rawValue: string
): Promise<Lead | null> {
  return withRefresh(async () => {
    const value = (rawValue || "").trim() || null;
    const link = phoneLink(value);
    const fields: Partial<Record<LeadField, unknown>> =
      which === 2
        ? { contato2: value, whatsapp2: link }
        : { contato: value, whatsapp: link };
    await updateLeadFields(id, fields);
    await addHistory(
      id,
      `WhatsApp ${which === 2 ? "2 " : ""}atualizado: ${value || "—"}${
        value && !link ? " (número inválido — link não gerado)" : ""
      }`
    );
    return getLead(id);
  });
}

export async function markContactToday(id: number): Promise<Lead | null> {
  return withRefresh(async () => {
    await updateLeadFields(id, { ultimoContato: today() });
    await addHistory(id, "Contato registrado manualmente");
    return getLead(id);
  });
}

export async function addNote(id: number, texto: string): Promise<Lead | null> {
  const clean = (texto || "").trim();
  if (!clean) return getLead(id);
  return withRefresh(async () => {
    await addHistory(id, "Anotação: " + clean);
    return getLead(id);
  });
}

/** Registra a abertura do WhatsApp (e avança leads "Novo" para "Contato enviado"). */
export async function logWhatsApp(id: number): Promise<Lead | null> {
  const lead = await getLead(id);
  if (!lead) return null;
  if (lead.status === "Novo") {
    return setStatus(id, "Contato enviado");
  }
  return withRefresh(async () => {
    await updateLeadFields(id, { ultimoContato: today() });
    await addHistory(id, "WhatsApp aberto");
    return getLead(id);
  });
}

/** Adia o follow-up em 2 dias a partir de hoje (ou da data futura já marcada). */
export async function snooze(id: number): Promise<Lead | null> {
  return withRefresh(async () => {
    const lead = await getLead(id);
    if (!lead) return null;
    const base =
      lead.followUp && lead.followUp > today() ? lead.followUp : today();
    const followUp = addDays(base, 2);
    await updateLeadFields(id, { followUp });
    await addHistory(id, `Follow-up adiado para ${fmtBR(followUp)}`);
    return getLead(id);
  });
}

export async function createLead(input: NewLeadInput): Promise<Lead | null> {
  return withRefresh(async () => {
    const contato = (input.contato || "").trim() || null;
    const contato2 = (input.contato2 || "").trim() || null;
    const id = await repoCreateLead({
      empresa: input.empresa.trim(),
      cidade: input.cidade?.trim() || null,
      segmento: input.segmento?.trim() || null,
      prioridade: input.prioridade || "Média",
      tipoContato: contato ? "WhatsApp" : null,
      contato,
      whatsapp: phoneLink(contato),
      contato2,
      whatsapp2: phoneLink(contato2),
      instagram: input.instagram?.trim() || null,
      site: input.site?.trim() || null,
      temSite: input.temSite || null,
      status: "Novo",
      responsavel: "Lucas",
      obs: input.obs?.trim() || null,
      verificadoEm: today(),
    });
    await addHistory(id, "Lead criado manualmente");
    return getLead(id);
  });
}

export async function deleteLead(id: number): Promise<{ ok: true }> {
  return withRefresh(async () => {
    await repoDeleteLead(id);
    return { ok: true as const };
  });
}

/**
 * Importa uma lista de leads (de CSV/JSON), ignorando duplicados por empresa
 * ou número de WhatsApp já existente. Retorna a lista completa atualizada.
 */
export async function importLeads(
  incoming: Array<Partial<Record<string, unknown>>>
): Promise<{ leads: Lead[]; added: number; skipped: number }> {
  return withRefresh(async () => {
    const current = await getAllLeads();
    const norm = (s: unknown) => (s ?? "").toString().toLowerCase().trim();
    const existing = new Set(current.map((l) => norm(l.empresa)));
    const existingWA = new Set(
      current.map((l) => norm(l.whatsapp)).filter(Boolean)
    );

    let added = 0;
    let skipped = 0;

    for (const raw of incoming) {
      const empresa = (raw.empresa ?? "").toString().trim();
      if (!empresa) {
        skipped++;
        continue;
      }
      const contato = raw.contato ? String(raw.contato).trim() : null;
      const contato2 = raw.contato2 ? String(raw.contato2).trim() : null;
      const whatsapp = (raw.whatsapp as string) || phoneLink(contato);
      if (existing.has(norm(empresa)) || (whatsapp && existingWA.has(norm(whatsapp)))) {
        skipped++;
        continue;
      }

      const valor =
        raw.valor != null && raw.valor !== ""
          ? Number(raw.valor) || null
          : null;

      const id = await repoCreateLead({
        empresa,
        cidade: (raw.cidade as string) || null,
        segmento: (raw.segmento as string) || null,
        prioridade: (raw.prioridade as string) || null,
        tipoContato: (raw.tipoContato as string) || (contato ? "WhatsApp" : null),
        contato,
        whatsapp,
        contato2,
        whatsapp2: (raw.whatsapp2 as string) || phoneLink(contato2),
        instagram: (raw.instagram as string) || null,
        site: (raw.site as string) || null,
        temSite: (raw.temSite as string) || null,
        email: (raw.email as string) || null,
        endereco: (raw.endereco as string) || null,
        situacao: (raw.situacao as string) || null,
        oportunidade: (raw.oportunidade as string) || null,
        status: normalizeStatus(raw.status as string),
        ultimoContato: (raw.ultimoContato as string) || null,
        followUp: (raw.followUp as string) || null,
        responsavel: (raw.responsavel as string) || null,
        valor,
        obs: (raw.obs as string) || null,
        fonteContato: (raw.fonteContato as string) || null,
        fontePresenca: (raw.fontePresenca as string) || null,
        verificadoEm: (raw.verificadoEm as string) || today(),
        mensagem: (raw.mensagem as string) || null,
      });
      await addHistory(id, "Lead importado de arquivo");
      existing.add(norm(empresa));
      if (whatsapp) existingWA.add(norm(whatsapp));
      added++;
    }

    return { leads: await getAllLeads(), added, skipped };
  });
}
