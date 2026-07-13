"use client";

import { useMemo } from "react";
import { useCrm } from "./crm-context";
import { STATUSES, PRIORIDADES } from "@/lib/domain";

export function FiltersBar({ count }: { count: number }) {
  const { leads, filters, patchFilters, clearFilters } = useCrm();

  const cidades = useMemo(
    () =>
      [...new Set(leads.map((l) => l.cidade).filter(Boolean))].sort() as string[],
    [leads]
  );
  const segmentos = useMemo(
    () =>
      [
        ...new Set(leads.map((l) => l.segmento).filter(Boolean)),
      ].sort() as string[],
    [leads]
  );

  return (
    <div className="filters">
      <select
        value={filters.fStatus}
        onChange={(e) => patchFilters({ fStatus: e.target.value })}
      >
        <option value="">Status: todos</option>
        {STATUSES.map((s) => (
          <option key={s.id}>{s.id}</option>
        ))}
      </select>
      <select
        value={filters.fPrio}
        onChange={(e) => patchFilters({ fPrio: e.target.value })}
      >
        <option value="">Prioridade: todas</option>
        {PRIORIDADES.map((p) => (
          <option key={p}>{p}</option>
        ))}
      </select>
      <select
        value={filters.fCidade}
        onChange={(e) => patchFilters({ fCidade: e.target.value })}
      >
        <option value="">Cidade: todas</option>
        {cidades.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <select
        value={filters.fSeg}
        onChange={(e) => patchFilters({ fSeg: e.target.value })}
      >
        <option value="">Segmento: todos</option>
        {segmentos.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
      <div
        className={`chip ${filters.onlyFu ? "on" : ""}`}
        onClick={() => patchFilters({ onlyFu: !filters.onlyFu })}
      >
        Só follow-ups pendentes
      </div>
      <div className="chip" onClick={clearFilters}>
        Limpar filtros
      </div>
      <div className="count-info">
        {count} de {leads.length} leads
      </div>
    </div>
  );
}
