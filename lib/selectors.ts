import type { Lead } from "./types";
import { CLOSED, PRIO_ORDER, STATUSES } from "./domain";
import { today } from "./format";

export interface Filters {
  search: string;
  fStatus: string;
  fPrio: string;
  fCidade: string;
  fSeg: string;
  onlyFu: boolean;
  sortKey: keyof Lead;
  sortDir: 1 | -1;
}

export const defaultFilters: Filters = {
  search: "",
  fStatus: "",
  fPrio: "",
  fCidade: "",
  fSeg: "",
  onlyFu: false,
  sortKey: "id",
  sortDir: 1,
};

/** Aplica busca, filtros e ordenação sobre a lista de leads. */
export function filterLeads(leads: Lead[], f: Filters): Lead[] {
  const q = f.search.toLowerCase();
  const t = today();
  return leads
    .filter((l) => {
      if (
        q &&
        !`${l.empresa} ${l.cidade} ${l.segmento} ${l.contato || ""} ${
          l.obs || ""
        } ${l.status}`
          .toLowerCase()
          .includes(q)
      )
        return false;
      if (f.fStatus && l.status !== f.fStatus) return false;
      if (f.fPrio && l.prioridade !== f.fPrio) return false;
      if (f.fCidade && l.cidade !== f.fCidade) return false;
      if (f.fSeg && l.segmento !== f.fSeg) return false;
      if (
        f.onlyFu &&
        !(l.followUp && l.followUp <= t && !CLOSED.includes(l.status))
      )
        return false;
      return true;
    })
    .sort((a, b) => {
      let va: string | number = (a[f.sortKey] as string | number) ?? "";
      let vb: string | number = (b[f.sortKey] as string | number) ?? "";
      if (f.sortKey === "prioridade") {
        va = PRIO_ORDER[a.prioridade ?? ""] ?? 9;
        vb = PRIO_ORDER[b.prioridade ?? ""] ?? 9;
      }
      if (f.sortKey === "valor") {
        va = a.valor || 0;
        vb = b.valor || 0;
      }
      return (va > vb ? 1 : va < vb ? -1 : 0) * f.sortDir;
    });
}

export interface Kpi {
  lbl: string;
  val: string | number;
  c: string;
  d: string;
}

/** Métricas do topo do dashboard + contador de follow-ups pendentes. */
export function computeKpis(leads: Lead[]): { kpis: Kpi[]; pending: number } {
  const t = today();
  const active = leads.filter((l) => !CLOSED.includes(l.status));
  const contacted = leads.filter((l) => l.status !== "Novo");
  const engaged = leads.filter((l) =>
    [
      "Respondeu",
      "Interessado",
      "Orçamento enviado",
      "Fechado",
      "Orçamento recusado",
      "Desinteressado",
    ].includes(l.status)
  );
  const late = leads.filter(
    (l) => l.followUp && l.followUp < t && !CLOSED.includes(l.status)
  );
  const todayFu = leads.filter(
    (l) => l.followUp === t && !CLOSED.includes(l.status)
  );
  const orc = leads.filter((l) => l.status === "Orçamento enviado");
  const won = leads.filter((l) => l.status === "Fechado");
  const orcSum = orc.reduce((s, l) => s + (l.valor || 0), 0);
  const wonSum = won.reduce((s, l) => s + (l.valor || 0), 0);
  const rate = contacted.length
    ? Math.round((engaged.length / contacted.length) * 100)
    : 0;

  const brl = (v: number) =>
    v.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    });

  const kpis: Kpi[] = [
    {
      lbl: "Total de leads",
      val: leads.length,
      c: "var(--accent)",
      d: `${active.length} ativos no funil`,
    },
    {
      lbl: "Contatados",
      val: contacted.length,
      c: "var(--blue)",
      d: `${leads.filter((l) => l.status === "Novo").length} ainda não abordados`,
    },
    {
      lbl: "Taxa de resposta",
      val: rate + "%",
      c: "var(--cyan)",
      d: `${engaged.length} interagiram`,
    },
    {
      lbl: "Em orçamento",
      val: orc.length,
      c: "var(--yellow)",
      d: orcSum ? brl(orcSum) + " em propostas" : "sem valores definidos",
    },
    {
      lbl: "Fechados",
      val: won.length,
      c: "var(--green)",
      d: wonSum ? brl(wonSum) + " ganhos" : "nenhum ainda",
    },
    {
      lbl: "Follow-ups pendentes",
      val: late.length + todayFu.length,
      c: late.length ? "var(--red)" : "var(--orange)",
      d: `${late.length} atrasados · ${todayFu.length} hoje`,
    },
  ];
  return { kpis, pending: late.length + todayFu.length };
}

export function countBy(leads: Lead[], key: keyof Lead): Record<string, number> {
  const m: Record<string, number> = {};
  for (const l of leads) {
    const v = (l[key] as string) || "—";
    m[v] = (m[v] || 0) + 1;
  }
  return m;
}

export function topN(
  map: Record<string, number>,
  n: number
): Array<{ k: string; v: number }> {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k, v]) => ({ k, v }));
}

/** Funil cumulativo por estágio. */
export function funnel(leads: Lead[]): Array<{ s: string; v: number }> {
  const stages = [
    "Novo",
    "Contato enviado",
    "Respondeu",
    "Interessado",
    "Orçamento enviado",
    "Fechado",
  ];
  const stageOf = (s: string) =>
    (STATUSES.find((x) => x.id === s) || { stage: 0 }).stage;
  return stages.map((s, i) => ({
    s,
    v: leads.filter((l) => stageOf(l.status) >= i).length,
  }));
}

/** Contagem de follow-ups pendentes (atrasados + hoje). */
export function pendingFollowUps(leads: Lead[]): number {
  const t = today();
  return leads.filter(
    (l) =>
      l.followUp &&
      l.followUp <= t &&
      !CLOSED.includes(l.status)
  ).length;
}
