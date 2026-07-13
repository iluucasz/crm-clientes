// Cria o esquema e popula o banco com os 60 leads reais da planilha original.
// Uso: node --env-file=.env scripts/seed.mjs [--reset]
//
// --reset  apaga as tabelas antes de recriar (recomeço limpo).

import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = neon(process.env.DATABASE_URL);

const RESET = process.argv.includes("--reset");

// Mesma normalização de status legado usada em lib/domain.ts
const MIGRATE = {
  "Contato respondeu": "Respondeu",
  Negociando: "Interessado",
  "Proposta enviada": "Orçamento enviado",
  Perdido: "Desinteressado",
};
const VALID = new Set([
  "Novo",
  "Contato enviado",
  "Respondeu",
  "Interessado",
  "Orçamento enviado",
  "Fechado",
  "Orçamento recusado",
  "Desinteressado",
  "Sem resposta",
]);
function normalizeStatus(s) {
  const m = MIGRATE[s] ?? s;
  return VALID.has(m) ? m : "Novo";
}

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
};

async function run() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não definida (rode com --env-file=.env).");
  }

  if (RESET) {
    console.log("• Removendo tabelas existentes (--reset)...");
    await sql`DROP TABLE IF EXISTS lead_history CASCADE`;
    await sql`DROP TABLE IF EXISTS leads CASCADE`;
  }

  console.log("• Aplicando esquema...");
  const schema = readFileSync(join(__dirname, "schema.sql"), "utf8");
  // O driver HTTP aceita um comando por chamada; separamos por ";".
  for (const stmt of schema.split(";").map((s) => s.trim()).filter(Boolean)) {
    await sql.query(stmt);
  }

  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM leads`;
  if (count > 0 && !RESET) {
    console.log(`• Já existem ${count} leads. Nada a semear (use --reset).`);
    return;
  }

  const seed = JSON.parse(
    readFileSync(join(__dirname, "..", "data", "seed-leads.json"), "utf8")
  );
  console.log(`• Inserindo ${seed.length} leads...`);

  for (const lead of seed) {
    const fields = {};
    for (const [key, col] of Object.entries(COLUMN_MAP)) {
      if (key === "valor") {
        fields[col] = lead.valor ?? null;
        continue;
      }
      if (key === "status") {
        fields[col] = normalizeStatus(lead.status);
        continue;
      }
      const v = lead[key];
      fields[col] = v === undefined || v === "" ? null : v;
    }

    const cols = Object.keys(fields);
    const placeholders = cols.map((_, i) => `$${i + 1}`);
    const params = cols.map((c) => fields[c]);

    const rows = await sql.query(
      `INSERT INTO leads (${cols.join(", ")}) VALUES (${placeholders.join(
        ", "
      )}) RETURNING id`,
      params
    );
    const id = rows[0].id;
    await sql`INSERT INTO lead_history (lead_id, texto) VALUES (${id}, ${"Lead importado da planilha original"})`;
  }

  const [{ total }] = await sql`SELECT COUNT(*)::int AS total FROM leads`;
  console.log(`✓ Concluído. ${total} leads no banco.`);
}

run().catch((err) => {
  console.error("✗ Erro ao semear:", err.message);
  process.exit(1);
});
