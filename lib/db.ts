import { neon } from "@neondatabase/serverless";

/**
 * Cliente SQL único para o banco Neon (Postgres).
 *
 * Usamos o driver HTTP `@neondatabase/serverless`, ideal para ambientes
 * serverless / edge do Next.js: cada query abre uma conexão HTTP curta,
 * sem necessidade de pool persistente. A URL agrupada (pooler) do Neon
 * vem da variável de ambiente `DATABASE_URL`.
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL não definida. Configure o arquivo .env com a conexão do Neon."
  );
}

export const sql = neon(connectionString);
