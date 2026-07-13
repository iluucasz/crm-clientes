"use client";

import { useRef, useState } from "react";
import { useCrm } from "./crm-context";
import { FiltersBar } from "./filters-bar";
import { Icon } from "./icon";
import { filterLeads } from "@/lib/selectors";
import { PRIO_COLORS, STATUSES } from "@/lib/domain";
import { brl, fmtBR, today } from "@/lib/format";

export function Pipeline() {
  const { leads, filters, openDrawer, setStatus } = useCrm();
  const rows = filterLeads(leads, filters);
  const dragId = useRef<number | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const t = today();

  return (
    <div className="view col">
      <FiltersBar count={rows.length} />
      <div className="kanban">
        {STATUSES.map((s) => {
          const cards = rows.filter((l) => l.status === s.id);
          const colSum = cards.reduce((a, l) => a + (l.valor || 0), 0);
          return (
            <div
              key={s.id}
              className={`kcol ${over === s.id ? "dragover" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(s.id);
              }}
              onDragLeave={() => setOver((c) => (c === s.id ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                if (dragId.current != null) {
                  setStatus(dragId.current, s.id);
                  dragId.current = null;
                }
              }}
            >
              <div className="kcol-head">
                <span className="kdot" style={{ background: s.color }} />
                {s.id}
                <span className="knum">
                  {cards.length}
                  {colSum ? ` · ${brl(colSum)}` : ""}
                </span>
              </div>
              <div className="kcards">
                {cards.map((l) => {
                  const fuColor = l.followUp
                    ? l.followUp < t
                      ? "var(--red)"
                      : l.followUp === t
                      ? "var(--orange)"
                      : "var(--green)"
                    : "";
                  return (
                    <div
                      key={l.id}
                      className="kcard"
                      draggable
                      style={{ ["--sc" as string]: s.color }}
                      onDragStart={() => {
                        dragId.current = l.id;
                      }}
                      onClick={() => openDrawer(l.id)}
                    >
                      <div className="kcard-title">
                        <b>{l.empresa}</b>
                        <span className="kcard-id">#{l.id}</span>
                      </div>
                      <div className="kcard-city">
                        {l.cidade || ""}
                      </div>
                      <div className="kmeta">
                        <span
                          style={{ color: PRIO_COLORS[l.prioridade ?? ""] || "#888" }}
                        >
                          {l.prioridade || "—"}
                        </span>
                        {l.valor ? (
                          <span style={{ color: "var(--green)" }}>
                            {brl(l.valor)}
                          </span>
                        ) : null}
                        <span>{(l.segmento || "").slice(0, 18)}</span>
                      </div>
                      {l.followUp && (
                        <div className="kfu" style={{ color: fuColor }}>
                          <Icon name="clock" size={12} />{" "}
                          {l.followUp < t ? "Atrasado — " : ""}
                          {fmtBR(l.followUp)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
