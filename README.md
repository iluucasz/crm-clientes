# CRM de Leads — dev-lss

CRM de prospecção construído em **Next.js 16 (App Router)** + **React 19** +
**TypeScript**, com dados reais em **Postgres (Neon)**. Migração do protótipo
`CRM_Leads.html` (single-file, localStorage) para uma arquitetura organizada,
com persistência em banco, Server Actions e componentes desacoplados.

## Funcionalidades

- **Dashboard** — KPIs, funil de conversão, distribuição por status/prioridade,
  top cidades/segmentos e próximos follow-ups.
- **Leads** — tabela com busca, filtros, ordenação e edição rápida (status,
  datas, valor) direto na linha.
- **Pipeline** — kanban com arrastar-e-soltar entre status.
- **Follow-ups** — agenda de retornos (atrasados, hoje, próximos 7 dias).
- **Automação** — ao mudar o status, o "último contato" é registrado e o próximo
  follow-up é sugerido automaticamente; todo evento entra no histórico do lead.
- **WhatsApp** — disparo da mensagem personalizada com um clique.
- **Importar / Exportar** — CSV e JSON (backup), com deduplicação na importação.

## Arquitetura

```
app/
  page.tsx              Server Component: busca leads do banco
  layout.tsx            Metadata + shell HTML
  actions/leads.ts      Server Actions (mutações + automação)
  api/export/route.ts   Exportação CSV/JSON direto do banco
components/             UI (client): shell, dashboard, tabela, kanban, drawer...
lib/
  db.ts                 Cliente Neon (Postgres)
  domain.ts             Status, prioridades e regras do funil
  format.ts             Formatação (BRL, datas, links WhatsApp)
  selectors.ts          Filtros e agregações (puros)
  repository/leads.ts   Acesso a dados (SQL) e mapeamento de/para o domínio
  types.ts              Tipos do domínio
scripts/
  schema.sql            DDL das tabelas
  seed.mjs              Cria o esquema e popula com os 60 leads reais
data/seed-leads.json    Dados originais da planilha
```

## Configuração

1. Crie o arquivo `.env` (não versionado) com a conexão do Neon:

   ```
   DATABASE_URL=postgresql://usuario:senha@host.neon.tech/neondb?sslmode=require
   ```

2. Instale as dependências e prepare o banco:

   ```bash
   pnpm install
   pnpm db:seed        # cria as tabelas e insere os leads (idempotente)
   # pnpm db:reset     # recomeço limpo (apaga e recria)
   ```

3. Rode em desenvolvimento:

   ```bash
   pnpm dev
   ```

> **Segurança:** o `.env` está no `.gitignore` e **não** é enviado ao GitHub.
> Em produção (Vercel/etc.), configure `DATABASE_URL` nas variáveis de ambiente.
