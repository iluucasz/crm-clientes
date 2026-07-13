"use client";

import { useMemo, useRef, useState } from "react";
import { useCrm } from "./crm-context";
import { useToast } from "./toast";
import { Icon } from "./icon";
import { Modal } from "./modal";
import { toCSV, parseCSV, rowsToLeads } from "@/lib/csv";
import { phoneLink, today } from "@/lib/format";

function download(name: string, content: string, type: string) {
  const b = new Blob([content], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(b);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Exemplo de arquivo JSON aceito na importação. */
const EXAMPLE_JSON = `[
  {
    "empresa": "Padaria Estrela",
    "cidade": "Nova Iguaçu",
    "segmento": "Alimentação",
    "prioridade": "Alta",
    "contato": "(21) 99999-1234",
    "contato2": "(21) 98888-5678",
    "instagram": "https://instagram.com/padariaestrela",
    "site": null,
    "temSite": "Não",
    "email": "contato@padariaestrela.com",
    "endereco": "Rua das Flores, 100 - Centro",
    "situacao": "Instagram ativo, sem site próprio.",
    "oportunidade": "Cardápio digital e pedidos por WhatsApp.",
    "status": "Novo",
    "ultimoContato": null,
    "followUp": "2026-07-20",
    "valor": 1500,
    "responsavel": "Lucas",
    "obs": "Indicação de cliente.",
    "mensagem": "Olá! Tudo bem? Trabalho com criação de sites..."
  }
]`;

type ImportRow = {
  raw: Record<string, unknown>;
  empresa: string;
  cidade: string;
  segmento: string;
  status: string;
  state: "novo" | "duplicado" | "invalido";
};

const norm = (s: unknown) => (s ?? "").toString().toLowerCase().trim();

export function ImportModal({ onClose }: { onClose: () => void }) {
  const { leads, importLeads } = useCrm();
  const toast = useToast();
  const [stage, setStage] = useState<"select" | "preview">("select");
  const [fileName, setFileName] = useState("");
  const [records, setRecords] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    const ext = file.name.split(".").pop()?.toLowerCase();
    try {
      let recs: Array<Record<string, unknown>> = [];
      if (ext === "json") {
        const data = JSON.parse(await file.text());
        if (!Array.isArray(data)) {
          setError("O JSON precisa ser uma lista (array) de objetos.");
          return;
        }
        recs = data;
      } else if (ext === "csv") {
        const rows = parseCSV(await file.text());
        if (rows.length < 2) {
          setError("CSV vazio ou sem linhas de dados.");
          return;
        }
        recs = rowsToLeads(rows[0], rows.slice(1));
      } else {
        setError("Formato não suportado. Use .csv ou .json.");
        return;
      }
      if (recs.length === 0) {
        setError("Nenhum registro encontrado no arquivo.");
        return;
      }
      setFileName(file.name);
      setRecords(recs);
      setStage("preview");
    } catch (e) {
      setError("Erro ao ler o arquivo: " + (e as Error).message);
    }
  }

  // Classifica cada registro (novo / duplicado / inválido) com a MESMA regra
  // de deduplicação do servidor, para o preview ser fiel ao resultado.
  const annotated = useMemo<ImportRow[]>(() => {
    const existing = new Set(leads.map((l) => norm(l.empresa)));
    const existingWA = new Set(
      leads.map((l) => norm(l.whatsapp)).filter(Boolean)
    );
    const seen = new Set<string>();
    const seenWA = new Set<string>();
    return records.map((r) => {
      const empresa = (r.empresa ?? "").toString().trim();
      const contato = r.contato ? String(r.contato).trim() : null;
      const whatsapp = ((r.whatsapp as string) || phoneLink(contato) || "").toString();
      let state: ImportRow["state"];
      if (!empresa) state = "invalido";
      else if (
        existing.has(norm(empresa)) ||
        (whatsapp && existingWA.has(norm(whatsapp))) ||
        seen.has(norm(empresa)) ||
        (whatsapp && seenWA.has(norm(whatsapp)))
      )
        state = "duplicado";
      else {
        state = "novo";
        seen.add(norm(empresa));
        if (whatsapp) seenWA.add(norm(whatsapp));
      }
      return {
        raw: r,
        empresa: empresa || "—",
        cidade: (r.cidade as string) || "—",
        segmento: (r.segmento as string) || "—",
        status: (r.status as string) || "Novo",
        state,
      };
    });
  }, [records, leads]);

  const novos = annotated.filter((a) => a.state === "novo").length;
  const dups = annotated.filter((a) => a.state === "duplicado").length;
  const invalid = annotated.filter((a) => a.state === "invalido").length;
  const MAX_ROWS = 200;

  const reset = () => {
    setStage("select");
    setRecords([]);
    setFileName("");
    setError(null);
  };

  const confirm = () => {
    importLeads(records);
    onClose();
  };

  const badge = (state: ImportRow["state"]) => {
    const map = {
      novo: { c: "var(--green)", t: "Novo" },
      duplicado: { c: "var(--orange)", t: "Duplicado" },
      invalido: { c: "var(--red)", t: "Sem empresa" },
    } as const;
    const { c, t } = map[state];
    return (
      <span
        className="imp-badge"
        style={{ background: c + "22", color: c, borderColor: c + "55" }}
      >
        {t}
      </span>
    );
  };

  // ---- Etapa 2: pré-visualização ----
  if (stage === "preview") {
    return (
      <Modal
        icon="import"
        title="Revisar importação"
        subtitle={fileName}
        width={640}
        onClose={onClose}
        footer={
          <>
            <button className="btn sm" onClick={reset}>
              Voltar
            </button>
            <button
              className="btn sm primary"
              onClick={confirm}
              disabled={novos === 0}
            >
              Confirmar importação ({novos})
            </button>
          </>
        }
      >
        <div className="imp-summary">
          <div className="imp-stat">
            <b style={{ color: "var(--green)" }}>{novos}</b>
            <span>novos</span>
          </div>
          <div className="imp-stat">
            <b style={{ color: "var(--orange)" }}>{dups}</b>
            <span>duplicados</span>
          </div>
          <div className="imp-stat">
            <b style={{ color: "var(--red)" }}>{invalid}</b>
            <span>sem empresa</span>
          </div>
          <div className="imp-stat">
            <b>{annotated.length}</b>
            <span>no arquivo</span>
          </div>
        </div>

        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
          Só os <b style={{ color: "var(--green)" }}>{novos} novos</b> serão
          adicionados. Duplicados (mesma empresa ou WhatsApp) e registros sem
          empresa são ignorados. Confira antes de confirmar.
        </p>

        <div className="imp-table-wrap">
          <table className="imp-table">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Cidade</th>
                <th>Segmento</th>
                <th>Status</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {annotated.slice(0, MAX_ROWS).map((a, i) => (
                <tr
                  key={i}
                  style={{ opacity: a.state === "novo" ? 1 : 0.55 }}
                >
                  <td>{a.empresa}</td>
                  <td>{a.cidade}</td>
                  <td>{a.segmento}</td>
                  <td>{a.status}</td>
                  <td>{badge(a.state)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {annotated.length > MAX_ROWS && (
          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
            Mostrando os primeiros {MAX_ROWS} de {annotated.length} registros.
          </p>
        )}
      </Modal>
    );
  }

  // ---- Etapa 1: seleção do arquivo ----
  return (
    <Modal
      icon="import"
      title="Importar leads"
      subtitle="Arquivos .csv ou .json — você revisa antes de confirmar"
      onClose={onClose}
      footer={
        <button className="btn sm" onClick={onClose}>
          Fechar
        </button>
      }
    >
      <div
        className={`drop-zone ${over ? "over" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
      >
        <Icon name="import" size={30} />
        Arraste um arquivo <b>.csv</b> ou <b>.json</b> aqui, ou clique para
        escolher.
        <br />
        Você verá uma pré-visualização antes de qualquer alteração.
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.json"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      {error && (
        <div
          className="imp-log"
          style={{ marginTop: 14, color: "var(--red)", borderColor: "var(--red)" }}
        >
          {error}
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="form-section" style={{ flex: 1, margin: 0 }}>
            Como preparar o JSON
          </div>
          <button
            className="btn sm"
            onClick={() => {
              navigator.clipboard
                .writeText(EXAMPLE_JSON)
                .then(() => toast("Exemplo copiado", "info"));
            }}
          >
            <Icon name="copy" size={13} /> Copiar
          </button>
          <button
            className="btn sm"
            onClick={() =>
              download("exemplo_importacao.json", EXAMPLE_JSON, "application/json")
            }
          >
            <Icon name="export" size={13} /> Baixar
          </button>
        </div>
        <p
          style={{
            fontSize: 12,
            color: "var(--muted)",
            margin: "10px 0",
            lineHeight: 1.6,
          }}
        >
          Envie uma <b>lista</b> de objetos. Só <b>empresa</b> é obrigatório; os
          demais campos são opcionais. Datas no formato <b>AAAA-MM-DD</b>;{" "}
          <b>prioridade</b>: Muito alta / Alta / Média / Baixa; <b>status</b>:
          Novo, Contato enviado, Respondeu, Interessado, Orçamento enviado,
          Fechado... O link do WhatsApp é gerado automaticamente a partir do{" "}
          <b>contato</b>.
        </p>
        <pre className="imp-log" style={{ maxHeight: 230, display: "block" }}>
          {EXAMPLE_JSON}
        </pre>
      </div>
    </Modal>
  );
}

export function ExportModal({ onClose }: { onClose: () => void }) {
  const { leads } = useCrm();
  const toast = useToast();

  const options = [
    {
      icon: "users" as const,
      title: "Planilha CSV",
      desc: "Todos os leads em formato de tabela, abre no Excel/Sheets.",
      action: () => {
        download(`leads_crm_${today()}.csv`, toCSV(leads), "text/csv;charset=utf-8");
        toast("CSV exportado", "info");
      },
    },
    {
      icon: "copy" as const,
      title: "Backup JSON",
      desc: "Cópia completa que pode ser reimportada mais tarde.",
      action: () => {
        download(
          `backup_crm_${today()}.json`,
          JSON.stringify(leads, null, 1),
          "application/json"
        );
        toast("Backup JSON gerado", "info");
      },
    },
    {
      icon: "globe" as const,
      title: "CSV direto do banco",
      desc: "Gerado no servidor a partir do estado atual do Postgres.",
      href: "/api/export?format=csv",
    },
  ];

  return (
    <Modal
      icon="export"
      title="Exportar / Backup"
      subtitle={`${leads.length} leads disponíveis`}
      onClose={onClose}
      footer={
        <button className="btn sm" onClick={onClose}>
          Fechar
        </button>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {options.map((o) =>
          o.href ? (
            <a key={o.title} className="export-card" href={o.href}>
              <div className="export-card-ic">
                <Icon name={o.icon} size={17} />
              </div>
              <div>
                <b>{o.title}</b>
                <span>{o.desc}</span>
              </div>
              <Icon name="export" size={15} />
            </a>
          ) : (
            <button key={o.title} className="export-card" onClick={o.action}>
              <div className="export-card-ic">
                <Icon name={o.icon} size={17} />
              </div>
              <div>
                <b>{o.title}</b>
                <span>{o.desc}</span>
              </div>
              <Icon name="export" size={15} />
            </button>
          )
        )}
      </div>
    </Modal>
  );
}
