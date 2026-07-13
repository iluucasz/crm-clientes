"use client";

import { useRef, useState } from "react";
import { useCrm } from "./crm-context";
import { useToast } from "./toast";
import { Icon } from "./icon";
import { toCSV, parseCSV, rowsToLeads } from "@/lib/csv";
import { today } from "@/lib/format";

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

export function ImportModal({ onClose }: { onClose: () => void }) {
  const { importLeads } = useCrm();
  const toast = useToast();
  const [log, setLog] = useState<string[]>([]);
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const append = (m: string) => setLog((l) => [...l, m]);

  async function handleFile(file: File) {
    append(`Lendo "${file.name}"...`);
    const ext = file.name.split(".").pop()?.toLowerCase();
    try {
      if (ext === "json") {
        const data = JSON.parse(await file.text());
        if (Array.isArray(data)) {
          importLeads(data);
          append(`Enviando ${data.length} registros...`);
        } else append("JSON não reconhecido.");
      } else if (ext === "csv") {
        const rows = parseCSV(await file.text());
        if (rows.length < 2) {
          append("CSV vazio.");
          return;
        }
        const leads = rowsToLeads(rows[0], rows.slice(1));
        importLeads(leads);
        append(`Enviando ${leads.length} registros...`);
      } else {
        append("Formato não suportado. Use .csv ou .json");
      }
    } catch (e) {
      append("Erro: " + (e as Error).message);
      toast("Falha ao ler o arquivo", "err");
    }
  }

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2>
          <Icon name="import" size={16} /> Importar leads
        </h2>
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
          <Icon name="import" size={32} />
          Arraste um arquivo <b>.csv</b> ou <b>.json</b> aqui, ou clique para
          escolher.
          <br />
          Leads duplicados (mesma empresa ou WhatsApp) são ignorados.
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
        {log.length > 0 && (
          <div className="imp-log">{log.join("\n")}</div>
        )}

        <div style={{ marginTop: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <h4
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: 0.9,
                color: "var(--muted)",
                fontWeight: 700,
                flex: 1,
              }}
            >
              Como preparar o JSON
            </h4>
            <button
              className="btn sm"
              onClick={() => {
                navigator.clipboard
                  .writeText(EXAMPLE_JSON)
                  .then(() => toast("Exemplo copiado", "info"));
              }}
            >
              <Icon name="copy" size={13} /> Copiar exemplo
            </button>
            <button
              className="btn sm"
              onClick={() =>
                download(
                  "exemplo_importacao.json",
                  EXAMPLE_JSON,
                  "application/json"
                )
              }
            >
              <Icon name="export" size={13} /> Baixar exemplo
            </button>
          </div>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
            Envie uma <b>lista</b> de objetos. Só <b>empresa</b> é obrigatório;
            os demais campos são opcionais. Datas no formato{" "}
            <b>AAAA-MM-DD</b>; <b>prioridade</b>: Muito alta / Alta / Média /
            Baixa; <b>status</b>: Novo, Contato enviado, Respondeu,
            Interessado, Orçamento enviado, Fechado... O link do WhatsApp é
            gerado automaticamente a partir do <b>contato</b>.
          </p>
          <pre
            className="imp-log"
            style={{ maxHeight: 220, display: "block" }}
          >
            {EXAMPLE_JSON}
          </pre>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
          <button className="btn sm" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export function ExportModal({ onClose }: { onClose: () => void }) {
  const { leads } = useCrm();
  const toast = useToast();

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2>
          <Icon name="export" size={16} /> Exportar / Backup
        </h2>
        <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 16 }}>
          Baixe seus {leads.length} leads em planilha (CSV) ou faça um backup
          completo (JSON) que pode ser reimportado depois.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            className="btn primary"
            onClick={() => {
              download(
                `leads_crm_${today()}.csv`,
                toCSV(leads),
                "text/csv;charset=utf-8"
              );
              toast("CSV exportado", "info");
            }}
          >
            <Icon name="export" size={14} /> Exportar CSV
          </button>
          <button
            className="btn"
            onClick={() => {
              download(
                `backup_crm_${today()}.json`,
                JSON.stringify(leads, null, 1),
                "application/json"
              );
              toast("Backup JSON gerado", "info");
            }}
          >
            <Icon name="export" size={14} /> Backup JSON
          </button>
          <a className="btn" href="/api/export?format=csv">
            <Icon name="globe" size={14} /> CSV direto do banco
          </a>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
          <button className="btn sm" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
