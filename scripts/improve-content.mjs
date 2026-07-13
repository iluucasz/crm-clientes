// Melhora o conteúdo dos leads:
//  - Reescreve a mensagem de WhatsApp preservando a parte personalizada e
//    padronizando o fechamento com o portfólio atualizado.
//  - Gera uma mensagem para leads que estavam sem texto.
//  - Preenche o campo `oferta` (valores + como funciona) com um texto padrão.
//
// Uso: node --env-file=.env scripts/improve-content.mjs
//       node --env-file=.env scripts/improve-content.mjs --seed-only  (só o JSON)

import { neon } from "@neondatabase/serverless";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Portfólio / referências atuais do Lucas. */
const LINKS = {
  portfolio: "https://www.dev-lss.com/",
  ecommerce: "https://liaeluan.com.br/",
  servico: "https://www.helenarodriguez.com.br/",
  vitrine: "https://4bs-viagens.vercel.app/",
  sistema: "https://pulse.seusdados.com/",
};

/** Escolhe 2 exemplos de portfólio conforme o segmento do lead. */
function examplesFor(segmento) {
  const s = (segmento || "").toLowerCase();
  if (/moda|loja|atacado|distribuidora|vestu|roupa|venda/.test(s))
    return [LINKS.ecommerce, LINKS.servico];
  if (/foto|est[uú]dio|storymaker/.test(s))
    return [LINKS.servico, LINKS.vitrine];
  if (/event|festa|s[ií]tio|espa[çc]o|cowork|casamento|locação/.test(s))
    return [LINKS.vitrine, LINKS.servico];
  if (/sistema|software|plataforma|gest[ãa]o|app/.test(s))
    return [LINKS.sistema, LINKS.servico];
  return [LINKS.servico, LINKS.ecommerce];
}

/** Fechamento padronizado com portfólio + chamada final. */
function tailFor(empresa, segmento) {
  const [a, b] = examplesFor(segmento);
  return `Este é o meu portfólio:
${LINKS.portfolio}

alguns sites que desenvolvi recentemente:
${a}
${b}

há vários outros exemplos no portfólio.

Se fizer sentido para você, posso preparar uma ideia inicial pensada para a ${empresa}, sem compromisso.`;
}

// Pontos onde a parte personalizada termina e começava o portfólio/exemplos.
const ANCHORS = [
  "Este é o meu portfólio",
  "Tenho como referência",
  "Um exemplo",
  "no meu portfólio",
];

function improveMessage(msg, empresa, segmento) {
  let cut = -1;
  for (const a of ANCHORS) {
    const i = msg.indexOf(a);
    if (i >= 0 && (cut < 0 || i < cut)) cut = i;
  }
  const prefix = (cut >= 0 ? msg.slice(0, cut) : msg)
    .replace(/[\s,;e]+$/i, "")
    .trim();
  return `${prefix}\n\n${tailFor(empresa, segmento)}`;
}

function generateMessage(empresa, segmento) {
  const prefix = `Boa tarde! Tudo bem?

Me chamo Lucas e trabalho com criação e melhoria de sites.

Conheci o trabalho da ${empresa} e achei a proposta de vocês bem interessante.

Pelo que observei, um site próprio poderia apresentar o trabalho de vocês de forma mais organizada e profissional, transmitindo mais confiança e facilitando o contato, mantendo o WhatsApp como principal canal de atendimento.`;
  return `${prefix}\n\n${tailFor(empresa, segmento)}`;
}

/** Texto padrão de oferta (valores + como funciona). */
const DEFAULT_OFFER = `Sobre valores e como funciona 😊

Eu monto um orçamento personalizado com tudo o que a sua loja/site precisa. O processo é simples:

1) Envio um formulário rápido com algumas perguntas básicas (tema, cores e informações da empresa).
2) Crio um layout visual para você aprovar antes de qualquer coisa.
3) Depois de aprovado, faço a construção completa do site.

⏱️ Prazo médio: de 1 a 2 semanas, dependendo da complexidade das animações e funcionalidades.

💰 Valores (variam conforme o que você precisa):
• Site vitrine de produtos, bem animado e com botão direto para o WhatsApp — a partir de R$ 1.000 (cerca de 1 semana).
• Loja completa com vendas online, sem depender do WhatsApp — de R$ 1.500 a R$ 2.000.
• Projetos mais simples (página única / institucional) — a partir de R$ 800.

Se quiser, já preparo uma proposta pensada especialmente para o seu negócio, sem compromisso!`;

function newMessage(lead) {
  return lead.mensagem
    ? improveMessage(lead.mensagem, lead.empresa, lead.segmento)
    : generateMessage(lead.empresa, lead.segmento);
}

// ----- Atualiza o arquivo de seed (para instalações limpas) -----
function updateSeedFile() {
  const path = join(__dirname, "..", "data", "seed-leads.json");
  const seed = JSON.parse(readFileSync(path, "utf8"));
  for (const l of seed) {
    l.mensagem = newMessage(l);
    l.oferta = DEFAULT_OFFER;
  }
  writeFileSync(path, JSON.stringify(seed, null, 2));
  console.log(`✓ Seed atualizado (${seed.length} leads).`);
}

async function updateDatabase() {
  const sql = neon(process.env.DATABASE_URL);
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS oferta TEXT`;
  const rows = await sql`SELECT id, empresa, segmento, mensagem FROM leads`;
  console.log(`• Atualizando ${rows.length} leads no banco...`);
  let generated = 0;
  for (const r of rows) {
    if (!r.mensagem) generated++;
    const msg = newMessage(r);
    await sql`UPDATE leads
      SET mensagem = ${msg},
          oferta = COALESCE(oferta, ${DEFAULT_OFFER}),
          updated_at = now()
      WHERE id = ${r.id}`;
  }
  console.log(
    `✓ Banco atualizado: ${rows.length} mensagens melhoradas (${generated} geradas do zero), oferta preenchida.`
  );
}

async function run() {
  updateSeedFile();
  if (!process.argv.includes("--seed-only")) {
    if (!process.env.DATABASE_URL)
      throw new Error("DATABASE_URL não definida (use --env-file=.env).");
    await updateDatabase();
  }
}

run().catch((e) => {
  console.error("✗ Erro:", e.message);
  process.exit(1);
});
