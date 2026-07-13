-- Esquema do CRM de Leads (Postgres / Neon)

CREATE TABLE IF NOT EXISTS leads (
  id             SERIAL PRIMARY KEY,
  empresa        TEXT NOT NULL,
  cidade         TEXT,
  segmento       TEXT,
  prioridade     TEXT,
  tipo_contato   TEXT,
  contato        TEXT,
  whatsapp       TEXT,
  contato2       TEXT,
  whatsapp2      TEXT,
  instagram      TEXT,
  site           TEXT,
  tem_site       TEXT,
  email          TEXT,
  endereco       TEXT,
  situacao       TEXT,
  oportunidade   TEXT,
  status         TEXT NOT NULL DEFAULT 'Novo',
  ultimo_contato DATE,
  follow_up      DATE,
  responsavel    TEXT,
  valor          NUMERIC(12, 2),
  obs            TEXT,
  fonte_contato  TEXT,
  fonte_presenca TEXT,
  verificado_em  DATE,
  mensagem       TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lead_history (
  id         SERIAL PRIMARY KEY,
  lead_id    INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  texto      TEXT NOT NULL,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up ON leads(follow_up);
CREATE INDEX IF NOT EXISTS idx_history_lead ON lead_history(lead_id);
