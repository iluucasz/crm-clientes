"use client";

import { useCrm } from "./crm-context";
import { FiltersBar } from "./filters-bar";
import { Icon } from "./icon";
import { ValorInput } from "./valor-input";
import { filterLeads } from "@/lib/selectors";
import { CLOSED, PRIO_COLORS, STATUSES, stColor } from "@/lib/domain";
import { today } from "@/lib/format";
import type { Lead } from "@/lib/types";

const COLUMNS: { key: keyof Lead; label: string }[] = [
  { key: "empresa", label: "Lead / empresa" },
  { key: "cidade", label: "Cidade" },
  { key: "prioridade", label: "Prioridade" },
  { key: "status", label: "Status" },
  { key: "ultimoContato", label: "Último contato" },
  { key: "followUp", label: "Próximo follow-up" },
  { key: "valor", label: "Valor" },
  { key: "id", label: "Ações" },
];

export function LeadsTable() {
  const {
    leads,
    filters,
    sortBy,
    openDrawer,
    setStatus,
    setField,
    markContact,
    openWhatsApp,
    copyMessage,
  } = useCrm();
  const rows = filterLeads(leads, filters);
  const t = today();

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="view col">
      <FiltersBar count={rows.length} />
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th
                  key={String(c.key)}
                  onClick={() => c.key !== "id" && sortBy(c.key)}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => {
              const sc = stColor(l.status);
              const fuClass =
                l.followUp && !CLOSED.includes(l.status)
                  ? l.followUp < t
                    ? "overdue"
                    : l.followUp === t
                    ? "today"
                    : ""
                  : "";
              return (
                <tr
                  key={l.id}
                  style={{ borderLeftColor: sc }}
                  onClick={() => openDrawer(l.id)}
                >
                  <td className="td-emp">
                    <b>{l.empresa}</b>
                    <span>
                      <span className="lead-row-id">#{l.id}</span>
                      {l.segmento ? ` · ${l.segmento}` : ""}
                    </span>
                  </td>
                  <td>{l.cidade || "—"}</td>
                  <td>
                    <span
                      className="prio-pill"
                      style={{
                        background: (PRIO_COLORS[l.prioridade ?? ""] || "#64748b") + "22",
                        color: PRIO_COLORS[l.prioridade ?? ""] || "#64748b",
                      }}
                    >
                      {l.prioridade || "—"}
                    </span>
                  </td>
                  <td onClick={stop}>
                    <select
                      className="status-sel"
                      id={`lead-${l.id}-status`}
                      aria-label={`Status de ${l.empresa}`}
                      style={{
                        backgroundColor: `${sc}18`,
                        borderColor: `${sc}66`,
                        color: sc,
                      }}
                      value={l.status}
                      onChange={(e) => setStatus(l.id, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s.id}>{s.id}</option>
                      ))}
                    </select>
                  </td>
                  <td onClick={stop}>
                    <input
                      id={`lead-${l.id}-ultimo-contato`}
                      aria-label={`Último contato de ${l.empresa}`}
                      type="date"
                      className="date-in"
                      value={l.ultimoContato || ""}
                      onChange={(e) =>
                        setField(l.id, "ultimoContato", e.target.value || null)
                      }
                    />
                  </td>
                  <td onClick={stop}>
                    <input
                      id={`lead-${l.id}-follow-up`}
                      aria-label={`Próximo follow-up de ${l.empresa}`}
                      type="date"
                      className={`date-in ${fuClass}`}
                      value={l.followUp || ""}
                      onChange={(e) =>
                        setField(l.id, "followUp", e.target.value || null)
                      }
                    />
                  </td>
                  <td onClick={stop}>
                    <ValorInput
                      id={`lead-${l.id}-valor`}
                      value={l.valor}
                      onCommit={(v) => setField(l.id, "valor", v)}
                    />
                  </td>
                  <td onClick={stop}>
                    {l.whatsapp && (
                      <button
                        className="ico-btn"
                        title="Abrir WhatsApp com a mensagem"
                        onClick={() => openWhatsApp(l.id, 1)}
                      >
                        <Icon name="chat" />
                      </button>
                    )}
                    {l.whatsapp2 && (
                      <button
                        className="ico-btn"
                        title="Abrir WhatsApp 2"
                        onClick={() => openWhatsApp(l.id, 2)}
                        style={{ position: "relative" }}
                      >
                        <Icon name="chat" />
                        <span
                          style={{
                            fontSize: 8.5,
                            fontWeight: 700,
                            position: "absolute",
                            top: 0,
                            right: -1,
                          }}
                        >
                          2
                        </span>
                      </button>
                    )}
                    {l.mensagem && (
                      <button
                        className="ico-btn"
                        title="Copiar mensagem"
                        onClick={() => copyMessage(l.id)}
                      >
                        <Icon name="copy" />
                      </button>
                    )}
                    <button
                      className="ico-btn"
                      title="Registrar contato hoje"
                      onClick={() => markContact(l.id)}
                    >
                      <Icon name="check" />
                    </button>
                    {l.instagram?.startsWith("http") && (
                      <a
                        className="ico-btn"
                        href={l.instagram}
                        target="_blank"
                        title="Instagram"
                        rel="noreferrer"
                      >
                        <Icon name="insta" />
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
