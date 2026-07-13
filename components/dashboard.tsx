"use client";

import { useCrm } from "./crm-context";
import {
  computeKpis,
  countBy,
  funnel,
  topN,
} from "@/lib/selectors";
import { CLOSED, PRIO_COLORS, STATUSES, stColor } from "@/lib/domain";
import { fmtBR, today } from "@/lib/format";
import type { Lead } from "@/lib/types";

const COOL = [
  "#4f6ef7",
  "#3b82f6",
  "#2aa8c4",
  "#2eb872",
  "#d4a017",
  "#e8763a",
  "#d0679d",
  "#8b5cf6",
];

function HBar({
  data,
  color,
}: {
  data: Array<{ k: string; v: number }>;
  color: (d: { k: string; v: number }, i: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.v), 1);
  return (
    <>
      {data.map((d, i) => (
        <div className="hbar-row" key={d.k + i}>
          <div className="nm" title={d.k}>
            {d.k}
          </div>
          <div className="tr">
            <div
              className="fl"
              style={{
                width: `${Math.max((d.v / max) * 100, 4)}%`,
                background: color(d, i),
              }}
            >
              {d.v}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export function Dashboard() {
  const { leads, openDrawer } = useCrm();
  const { kpis } = computeKpis(leads);
  const t = today();

  const statusData = STATUSES.map((s) => ({
    k: s.id,
    v: countBy(leads, "status")[s.id] || 0,
  }));
  const fun = funnel(leads);
  const fMax = Math.max(fun[0]?.v ?? 1, 1);

  const prioCount = countBy(leads, "prioridade");
  const prioOrder = (["Muito alta", "Alta", "Média", "Baixa"] as const).filter(
    (p) => prioCount[p]
  );
  const total = leads.length || 1;
  let acc = 0;
  const segs = prioOrder.map((p) => {
    const frac = prioCount[p] / total;
    const seg = `${PRIO_COLORS[p]} ${acc * 360}deg ${(acc + frac) * 360}deg`;
    acc += frac;
    return seg;
  });

  const fus = leads
    .filter((l) => l.followUp && !CLOSED.includes(l.status))
    .sort((a, b) => (a.followUp! < b.followUp! ? -1 : 1))
    .slice(0, 6);

  return (
    <div className="view">
      <div className="kpi-grid">
        {kpis.map((k) => (
          <div className="kpi" style={{ ["--kc" as string]: k.c }} key={k.lbl}>
            <div className="lbl">{k.lbl}</div>
            <div className="val">{k.val}</div>
            <div className="delta">{k.d}</div>
          </div>
        ))}
      </div>

      <div className="grid-3">
        <div className="panel">
          <h3>
            <span className="dot" />
            Leads por status
          </h3>
          <HBar data={statusData} color={(d) => stColor(d.k)} />
        </div>
        <div className="panel">
          <h3>
            <span className="dot" style={{ background: "var(--purple)" }} />
            Funil de conversão
          </h3>
          <div className="funnel">
            {fun.map((f) => (
              <div
                className="fstep"
                key={f.s}
                style={{
                  width: `${Math.max((f.v / fMax) * 100, 30)}%`,
                  ["--funnel-color" as string]: stColor(f.s),
                }}
              >
                <span>{f.s}</span>
                <b>{f.v}</b>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <h3>
            <span className="dot" style={{ background: "var(--cyan)" }} />
            Prioridade
          </h3>
          <div className="donut-wrap">
            <div
              className="priority-donut"
              style={{ background: `conic-gradient(${segs.join(",")})` }}
            >
              <div className="priority-donut-center">
                <b>{leads.length}</b>
                <span>
                  leads
                </span>
              </div>
            </div>
            <div className="legend">
              {prioOrder.map((p) => (
                <div className="li" key={p}>
                  <span className="sw" style={{ background: PRIO_COLORS[p] }} />
                  {p}: <b>{prioCount[p]}</b> (
                  {Math.round((prioCount[p] / total) * 100)}%)
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="panel">
          <h3>
            <span className="dot" style={{ background: "var(--orange)" }} />
            Top cidades
          </h3>
          <HBar
            data={topN(countBy(leads, "cidade"), 8)}
            color={(_, i) => COOL[i % 8]}
          />
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <h3>
            <span className="dot" style={{ background: "var(--pink)" }} />
            Top segmentos
          </h3>
          <HBar
            data={topN(countBy(leads, "segmento"), 8)}
            color={(_, i) => COOL[(i + 3) % 8]}
          />
        </div>
        <div className="panel">
          <h3>
            <span className="dot" style={{ background: "var(--red)" }} />
            Próximos follow-ups
          </h3>
          {fus.length ? (
            fus.map((l: Lead) => {
              const c =
                l.followUp! < t
                  ? "var(--red)"
                  : l.followUp === t
                  ? "var(--orange)"
                  : "var(--green)";
              const tag =
                l.followUp! < t
                  ? "ATRASADO"
                  : l.followUp === t
                  ? "HOJE"
                  : fmtBR(l.followUp);
              return (
                <div
                  className="fu-item"
                  key={l.id}
                  onClick={() => openDrawer(l.id)}
                >
                  <div className="fud" style={{ color: c }}>
                    {tag}
                  </div>
                  <div className="fue">
                    <b>{l.empresa}</b>
                    <span>
                      #{l.id} · {l.cidade || "Sem cidade"} · {l.status}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="fu-empty">Nenhum follow-up agendado</div>
          )}
        </div>
      </div>
    </div>
  );
}
