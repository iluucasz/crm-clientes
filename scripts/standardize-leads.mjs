// Padroniza mensagens de WhatsApp por segmento e preenche um valor aproximado
// (estimativa de orçamento) para cada lead.
//
// - Mensagem: gerada com uma observação profissional adequada ao segmento,
//   sempre com o mesmo padrão (saudação, apresentação, observação, portfólio
//   atualizado e chamada final). Isso deixa TODOS os leads no mesmo nível.
// - Valor: estimado pelo tipo de negócio; só preenche onde ainda está vazio
//   (não sobrescreve orçamentos que você já definiu).
//
// Uso: node --env-file=.env scripts/standardize-leads.mjs
//       node --env-file=.env scripts/standardize-leads.mjs --seed-only

import { neon } from "@neondatabase/serverless";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const LINKS = {
  portfolio: "https://www.dev-lss.com/",
  ecommerce: "https://liaeluan.com.br/",
  servico: "https://www.helenarodriguez.com.br/",
  vitrine: "https://4bs-viagens.vercel.app/",
  sistema: "https://pulse.seusdados.com/",
};

/**
 * Regras por segmento: observação personalizada, exemplos de portfólio e
 * valor estimado do serviço (em reais).
 */
function profileFor(segmento) {
  const s = (segmento || "").toLowerCase();
  const wa = "mantendo o WhatsApp como principal canal de atendimento";

  if (/foto|est[uú]dio|storymaker/.test(s))
    return {
      obs: `Pelo que observei, o seu trabalho tem um forte apelo visual e um site-portfólio próprio poderia organizar os ensaios por categoria, transmitir mais autoridade e facilitar novos pedidos de orçamento, ${wa}.`,
      links: [LINKS.servico, LINKS.vitrine],
      valor: 1000,
    };
  if (/moda|loja|atacado|distribuidora|vestu|roupa|venda/.test(s))
    return {
      obs: `Pelo que observei, um site próprio poderia apresentar seus produtos de forma mais organizada e profissional, com catálogo e pedidos online, ${wa}.`,
      links: [LINKS.ecommerce, LINKS.servico],
      valor: 1500,
    };
  if (/odonto|cl[íi]nic|m[ée]dic|dental|sa[úu]de/.test(s))
    return {
      obs: `Pelo que observei, um site próprio poderia apresentar os tratamentos com mais clareza, transmitir confiança e organizar os agendamentos, ${wa}.`,
      links: [LINKS.servico, LINKS.ecommerce],
      valor: 1200,
    };
  if (/est[ée]tica|sal[ãa]o|beleza|est[ée]tico/.test(s))
    return {
      obs: `Pelo que observei, um site próprio poderia apresentar cada procedimento com mais clareza e transmitir confiança antes do agendamento, ${wa}.`,
      links: [LINKS.servico, LINKS.ecommerce],
      valor: 1000,
    };
  if (/pilates|fisio|movimento|massag/.test(s))
    return {
      obs: `Pelo que observei, um site próprio poderia apresentar suas modalidades e a estrutura do espaço com mais clareza, transmitir confiança e facilitar o agendamento, ${wa}.`,
      links: [LINKS.servico, LINKS.ecommerce],
      valor: 1000,
    };
  if (/restaurante|bar|hamb|pizza|alimenta|gastro|lanch|caf[ée]/.test(s))
    return {
      obs: `Pelo que observei, um site próprio poderia apresentar o cardápio de forma mais organizada e atraente, com pedidos direto pelo WhatsApp, transmitindo mais profissionalismo para o seu público.`,
      links: [LINKS.servico, LINKS.vitrine],
      valor: 1000,
    };
  if (/event|festa|s[ií]tio|espa[çc]o|cowork|casamento|loca[çc]/.test(s))
    return {
      obs: `Pelo que observei, um site próprio com galeria, estrutura e pedido de orçamento poderia transmitir muito mais confiança para quem está escolhendo o local, ${wa}.`,
      links: [LINKS.vitrine, LINKS.servico],
      valor: 1200,
    };
  if (/tatuagem|piercing|tattoo/.test(s))
    return {
      obs: `Pelo que observei, um site-portfólio próprio poderia organizar seus trabalhos por estilo, transmitir mais autoridade e facilitar os agendamentos, ${wa}.`,
      links: [LINKS.servico, LINKS.vitrine],
      valor: 1000,
    };
  return {
    obs: `Pelo que observei, um site próprio poderia apresentar o seu trabalho de forma mais organizada e profissional, transmitir mais confiança e facilitar o contato, ${wa}.`,
    links: [LINKS.servico, LINKS.ecommerce],
    valor: 1000,
  };
}

function buildMessage(empresa, segmento) {
  const { obs, links } = profileFor(segmento);
  return `Boa tarde! Tudo bem?

Me chamo Lucas e trabalho com criação e melhoria de sites.

Conheci o trabalho da ${empresa} e achei a proposta de vocês muito interessante.

${obs}

Este é o meu portfólio:
${LINKS.portfolio}

alguns sites que desenvolvi recentemente:
${links[0]}
${links[1]}

há vários outros exemplos no portfólio.

Se fizer sentido para você, posso preparar uma ideia inicial pensada para a ${empresa}, sem compromisso.`;
}

function updateSeedFile() {
  const path = join(__dirname, "..", "data", "seed-leads.json");
  const seed = JSON.parse(readFileSync(path, "utf8"));
  for (const l of seed) {
    const p = profileFor(l.segmento);
    l.mensagem = buildMessage(l.empresa, l.segmento);
    if (l.valor == null) l.valor = p.valor;
  }
  writeFileSync(path, JSON.stringify(seed, null, 2));
  console.log(`✓ Seed atualizado (${seed.length} leads).`);
}

async function updateDatabase() {
  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`SELECT id, empresa, segmento FROM leads`;
  console.log(`• Padronizando ${rows.length} leads no banco...`);
  for (const r of rows) {
    const p = profileFor(r.segmento);
    const msg = buildMessage(r.empresa, r.segmento);
    await sql`UPDATE leads
      SET mensagem = ${msg},
          valor = COALESCE(valor, ${p.valor}),
          updated_at = now()
      WHERE id = ${r.id}`;
  }
  const [{ semvalor }] =
    await sql`SELECT count(*)::int AS semvalor FROM leads WHERE valor IS NULL`;
  console.log(
    `✓ Banco padronizado: ${rows.length} mensagens, valores estimados preenchidos (${semvalor} ainda sem valor).`
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
