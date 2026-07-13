// Padroniza mensagens de WhatsApp por segmento (com variação natural, para não
// ficarem robotizadas) e preenche um valor aproximado por lead.
//
// - Cada lead recebe uma combinação de frases (saudação, apresentação, elogio,
//   fechamento) escolhida de forma determinística pelo id — assim os textos
//   variam entre si e soam humanos, sem ficarem idênticos.
// - A saudação fica como "Boa tarde!" no texto salvo, mas é ajustada ao horário
//   (Bom dia / Boa tarde / Boa noite) na hora de enviar/copiar, pelo app.
// - Valor: estimado pelo tipo de negócio; só preenche onde ainda está vazio.
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

/** Regras por segmento: observação (tom mais humano), exemplos e valor. */
function profileFor(segmento) {
  const s = (segmento || "").toLowerCase();
  const wa = "sem abrir mão do WhatsApp como canal principal de atendimento";

  if (/foto|est[uú]dio|storymaker/.test(s))
    return {
      obs: `Reparei que o seu trabalho tem um apelo visual bem forte, e um site-portfólio próprio ajudaria a organizar os ensaios por categoria, passar mais autoridade e receber novos pedidos com mais facilidade — tudo isso ${wa}.`,
      links: [LINKS.servico, LINKS.vitrine],
      valor: 1000,
    };
  if (/moda|loja|atacado|distribuidora|vestu|roupa|venda/.test(s))
    return {
      obs: `Acredito que um site próprio deixaria seus produtos bem mais fáceis de apresentar, com catálogo e pedidos online, ${wa}.`,
      links: [LINKS.ecommerce, LINKS.servico],
      valor: 1500,
    };
  if (/odonto|cl[íi]nic|m[ée]dic|dental|sa[úu]de/.test(s))
    return {
      obs: `Acho que um site próprio ajudaria bastante a explicar os tratamentos com clareza, passar confiança para quem ainda não conhece e organizar os agendamentos, ${wa}.`,
      links: [LINKS.servico, LINKS.ecommerce],
      valor: 1200,
    };
  if (/est[ée]tica|sal[ãa]o|beleza|est[ée]tico/.test(s))
    return {
      obs: `Acho que um site próprio ajudaria a mostrar cada procedimento com mais clareza e a passar confiança antes do agendamento, ${wa}.`,
      links: [LINKS.servico, LINKS.ecommerce],
      valor: 1000,
    };
  if (/pilates|fisio|movimento|massag/.test(s))
    return {
      obs: `Acho que um site próprio ajudaria a apresentar as modalidades e a estrutura do espaço com mais clareza, passar confiança e facilitar o agendamento, ${wa}.`,
      links: [LINKS.servico, LINKS.ecommerce],
      valor: 1000,
    };
  if (/restaurante|bar|hamb|pizza|alimenta|gastro|lanch|caf[ée]/.test(s))
    return {
      obs: `Acredito que um site próprio deixaria o cardápio bem mais organizado e convidativo, com pedidos direto pelo WhatsApp, passando ainda mais profissionalismo para o seu público.`,
      links: [LINKS.servico, LINKS.vitrine],
      valor: 1000,
    };
  if (/event|festa|s[ií]tio|espa[çc]o|cowork|casamento|loca[çc]/.test(s))
    return {
      obs: `Acredito que um site com galeria, estrutura e um espaço para pedir orçamento passaria muito mais confiança para quem está escolhendo o local, ${wa}.`,
      links: [LINKS.vitrine, LINKS.servico],
      valor: 1200,
    };
  if (/tatuagem|piercing|tattoo/.test(s))
    return {
      obs: `Reparei que faz sentido um site-portfólio próprio para organizar seus trabalhos por estilo, passar mais autoridade e facilitar os agendamentos, ${wa}.`,
      links: [LINKS.servico, LINKS.vitrine],
      valor: 1000,
    };
  return {
    obs: `Acredito que um site próprio ajudaria a apresentar o seu trabalho de forma mais organizada e profissional, passar mais confiança e facilitar o contato, ${wa}.`,
    links: [LINKS.servico, LINKS.ecommerce],
    valor: 1000,
  };
}

// Variações escolhidas pelo id (determinístico e estável, mas variado).
const pick = (arr, n) => arr[(((n % arr.length) + arr.length) % arr.length)];

const SAUD = ["Tudo bem?", "Tudo certo?", "Como vai?", "Tudo tranquilo?"];
const INTRO = [
  "Me chamo Lucas e trabalho com criação e melhoria de sites.",
  "Aqui é o Lucas, eu trabalho criando e melhorando sites.",
  "Meu nome é Lucas e trabalho com desenvolvimento de sites.",
];
const CONHECI = [
  "Conheci o trabalho da {e} e gostei bastante do que vocês fazem.",
  "Cheguei até a {e} pelas redes e curti muito a forma como vocês trabalham.",
  "Vim conhecer a {e} por aqui e achei o trabalho de vocês muito bacana.",
  "Andei acompanhando a {e} e gostei bastante da proposta de vocês.",
];
const EXEMPLOS = [
  "aqui alguns sites que fiz recentemente:",
  "dá uma olhada em alguns trabalhos recentes:",
  "separei alguns exemplos que desenvolvi:",
];
const OUTROS = [
  "e tem bastante coisa por lá também.",
  "tem vários outros no portfólio.",
  "há mais exemplos no portfólio, se quiser ver.",
];
const FECHO = [
  "Se fizer sentido pra você, monto uma ideia inicial pensada pra {e}, sem compromisso — é só me chamar.",
  "Se topar, eu preparo uma primeira ideia pra {e}, sem nenhum compromisso.",
  "Caso queira, posso te enviar uma sugestão inicial pra {e}, sem compromisso algum.",
  "Se curtir a ideia, faço uma proposta inicial pra {e} sem compromisso, é só avisar.",
];

function buildMessage(empresa, segmento, id) {
  const { obs, links } = profileFor(segmento);
  const rep = (t) => t.replaceAll("{e}", empresa);
  return `Boa tarde! ${pick(SAUD, id)}

${pick(INTRO, id + 1)}

${rep(pick(CONHECI, id + 2))}

${obs}

Este é o meu portfólio:
${LINKS.portfolio}

${pick(EXEMPLOS, id + 1)}
${links[0]}
${links[1]}

${pick(OUTROS, id + 3)}

${rep(pick(FECHO, id))}`;
}

function updateSeedFile() {
  const path = join(__dirname, "..", "data", "seed-leads.json");
  const seed = JSON.parse(readFileSync(path, "utf8"));
  for (const l of seed) {
    const p = profileFor(l.segmento);
    l.mensagem = buildMessage(l.empresa, l.segmento, l.id);
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
    const msg = buildMessage(r.empresa, r.segmento, r.id);
    await sql`UPDATE leads
      SET mensagem = ${msg},
          valor = COALESCE(valor, ${p.valor}),
          updated_at = now()
      WHERE id = ${r.id}`;
  }
  const [{ semvalor }] =
    await sql`SELECT count(*)::int AS semvalor FROM leads WHERE valor IS NULL`;
  console.log(
    `✓ Banco padronizado: ${rows.length} mensagens (com variação), valores preenchidos (${semvalor} ainda sem valor).`
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
