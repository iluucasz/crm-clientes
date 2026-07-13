"use client";

import { useCrm } from "./crm-context";
import { Icon } from "./icon";
import { CLOSED, stColor } from "@/lib/domain";
import { addDays, fmtBR, today } from "@/lib/format";
import type { Lead } from "@/lib/types";

export function FollowUps() {
  const { leads, openDrawer, openWhatsApp, snooze } = useCrm();
  const t = today();
  const next7 = addDays(t, 7);
  const act = leads.filter((l) => !CLOSED.includes(l.status));

  const late = act
    .filter((l) => l.followUp && l.followUp < t)
    .sort((a, b) => (a.followUp! < b.followUp! ? -1 : 1));
  const todayList = act.filter((l) => l.followUp === t);
  const next = act
    .filter((l) => l.followUp && l.followUp > t && l.followUp <= next7)
    .sort((a, b) => (a.followUp! < b.followUp! ? -1 : 1));
  const none = act.filter((l) => !l.followUp && l.status !== "Novo");

  const section = (
    title: string,
    color: string,
    items: Lead[],
    tag: (l: Lead) => { t: string; c: string }
  ) => (
    <div className="fu-sec" key={title}>
      <h3>
        <span className="dot" style={{ background: color }} />
        {title} <span style={{ color: "var(--muted)" }}>({items.length})</span>
      </h3>
      {items.length ? (
        items.map((l) => (
          <div className="fu-item" key={l.id} onClick={() => openDrawer(l.id)}>
            <div className="fud" style={{ color: tag(l).c }}>
              {tag(l).t}
            </div>
            <div className="fue" style={{ flex: 1 }}>
              <b>{l.empresa}</b>
              <span>
                {l.cidade} · {l.segmento} ·{" "}
                <span style={{ color: stColor(l.status) }}>{l.status}</span>
              </span>
            </div>
            {l.whatsapp && (
              <button
                className="btn sm"
                onClick={(e) => {
                  e.stopPropagation();
                  openWhatsApp(l.id, 1);
                }}
              >
                <Icon name="chat" size={13} /> WhatsApp
              </button>
            )}
            <button
              className="btn sm"
              onClick={(e) => {
                e.stopPropagation();
                snooze(l.id);
              }}
            >
              Adiar 2 dias
            </button>
          </div>
        ))
      ) : (
        <div className="fu-empty">Nada por aqui</div>
      )}
    </div>
  );

  return (
    <div className="view">
      {section("Atrasados", "var(--red)", late, (l) => ({
        t: fmtBR(l.followUp),
        c: "var(--red)",
      }))}
      {section("Para hoje", "var(--orange)", todayList, () => ({
        t: "HOJE",
        c: "var(--orange)",
      }))}
      {section("Próximos 7 dias", "var(--green)", next, (l) => ({
        t: fmtBR(l.followUp),
        c: "var(--green)",
      }))}
      {section("Sem follow-up agendado", "var(--muted)", none, () => ({
        t: "—",
        c: "var(--muted)",
      }))}
    </div>
  );
}
