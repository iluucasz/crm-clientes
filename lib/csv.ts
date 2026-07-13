import type { Lead } from "./types";

/** Colunas de exportação: [cabeçalho, chave do domínio]. */
export const EXPORT_COLUMNS: Array<[string, keyof Lead]> = [
  ["ID", "id"],
  ["Empresa", "empresa"],
  ["Cidade", "cidade"],
  ["Segmento", "segmento"],
  ["Prioridade", "prioridade"],
  ["Tipo de contato", "tipoContato"],
  ["Contato público", "contato"],
  ["Link WhatsApp", "whatsapp"],
  ["Contato 2", "contato2"],
  ["Link WhatsApp 2", "whatsapp2"],
  ["Instagram", "instagram"],
  ["Site/página", "site"],
  ["Possui site próprio?", "temSite"],
  ["E-mail", "email"],
  ["Endereço", "endereco"],
  ["Situação digital", "situacao"],
  ["Oportunidade sugerida", "oportunidade"],
  ["Status", "status"],
  ["Último contato", "ultimoContato"],
  ["Próximo follow-up", "followUp"],
  ["Valor do orçamento", "valor"],
  ["Responsável", "responsavel"],
  ["Observações", "obs"],
  ["Fonte do contato", "fonteContato"],
  ["Fonte da presença", "fontePresenca"],
  ["Verificado em", "verificadoEm"],
  ["Mensagem personalizada", "mensagem"],
  ["Oferta", "oferta"],
];

/** Cabeçalho de importação (label normalizado) -> chave do domínio. */
export const IMPORT_HEADER_MAP: Record<string, string> = {
  id: "id",
  empresa: "empresa",
  cidade: "cidade",
  segmento: "segmento",
  prioridade: "prioridade",
  "tipo de contato": "tipoContato",
  "contato público": "contato",
  "link whatsapp": "whatsapp",
  "contato 2": "contato2",
  "whatsapp 2": "contato2",
  "link whatsapp 2": "whatsapp2",
  instagram: "instagram",
  "site/página": "site",
  "possui site próprio?": "temSite",
  "e-mail": "email",
  endereço: "endereco",
  "situação digital": "situacao",
  "oportunidade sugerida": "oportunidade",
  status: "status",
  "último contato": "ultimoContato",
  "próximo follow-up": "followUp",
  responsável: "responsavel",
  observações: "obs",
  "fonte do contato": "fonteContato",
  "fonte da presença": "fontePresenca",
  "verificado em": "verificadoEm",
  "mensagem personalizada": "mensagem",
  oferta: "oferta",
  "texto de oferta": "oferta",
  valor: "valor",
  "orçamento (r$)": "valor",
  "valor do orçamento": "valor",
};

export function toCSV(leads: Lead[]): string {
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return (
    "﻿" +
    EXPORT_COLUMNS.map((c) => c[0]).join(",") +
    "\n" +
    leads
      .map((l) => EXPORT_COLUMNS.map((c) => esc(l[c[1]])).join(","))
      .join("\n")
  );
}

/** Parser simples de CSV (aspas, `,` ou `;` como separador). */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = false;
      } else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === "," || c === ";") {
      row.push(cur);
      cur = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cur);
      cur = "";
      if (row.some((x) => x !== "")) rows.push(row);
      row = [];
    } else cur += c;
  }
  if (cur !== "" || row.length) {
    row.push(cur);
    if (row.some((x) => x !== "")) rows.push(row);
  }
  return rows;
}

/** Converte linhas de planilha em objetos de lead usando o mapa de cabeçalhos. */
export function rowsToLeads(
  headers: string[],
  rows: string[][]
): Array<Record<string, unknown>> {
  const idx = headers.map(
    (h) => IMPORT_HEADER_MAP[(h || "").toString().toLowerCase().trim()] || null
  );
  return rows.map((r) => {
    const o: Record<string, unknown> = {};
    idx.forEach((k, i) => {
      if (k && r[i] != null && r[i] !== "")
        o[k] = typeof r[i] === "string" ? r[i].trim() : r[i];
    });
    return o;
  });
}
