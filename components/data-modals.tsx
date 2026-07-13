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
