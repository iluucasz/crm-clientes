"use client";

import { useState } from "react";
import type { Lead } from "@/lib/types";
import { CrmProvider, useCrm, type View } from "./crm-context";
import { ToastProvider } from "./toast";
import { Sidebar } from "./sidebar";
import { Dashboard } from "./dashboard";
import { LeadsTable } from "./leads-table";
import { Pipeline } from "./pipeline";
import { FollowUps } from "./follow-ups";
import { LeadDrawer } from "./lead-drawer";
import { NewLeadModal } from "./new-lead-modal";
import { ImportModal, ExportModal } from "./data-modals";
import { Icon } from "./icon";

const TITLES: Record<View, { title: string; sub: string }> = {
  dashboard: { title: "Dashboard", sub: "Visão geral da prospecção" },
  leads: { title: "Leads", sub: "Tabela completa com edição rápida" },
  pipeline: { title: "Pipeline", sub: "Arraste os cards entre os status" },
  followups: { title: "Follow-ups", sub: "Quem precisa de retorno" },
};

type Modal = null | "new" | "import" | "export";

function Inner() {
  const { view, filters, patchFilters } = useCrm();
  const [modal, setModal] = useState<Modal>(null);
  const meta = TITLES[view];

  return (
    <div className="app">
      <Sidebar
        onImport={() => setModal("import")}
        onExport={() => setModal("export")}
      />
      <div className="main">
        <div className="topbar">
          <div>
            <h1>{meta.title}</h1>
            <div className="sub">{meta.sub}</div>
          </div>
          <div className="search-box">
            <Icon name="search" size={14} />
            <input
              value={filters.search}
              placeholder="Buscar empresa, cidade, segmento..."
              onChange={(e) => patchFilters({ search: e.target.value })}
            />
          </div>
          <button className="btn primary" onClick={() => setModal("new")}>
            <Icon name="plus" size={14} />
            Novo lead
          </button>
        </div>

        <div className="content">
          {view === "dashboard" && <Dashboard />}
          {view === "leads" && <LeadsTable />}
          {view === "pipeline" && <Pipeline />}
          {view === "followups" && <FollowUps />}
        </div>
      </div>

      <LeadDrawer />
      {modal === "new" && <NewLeadModal onClose={() => setModal(null)} />}
      {modal === "import" && <ImportModal onClose={() => setModal(null)} />}
      {modal === "export" && <ExportModal onClose={() => setModal(null)} />}
    </div>
  );
}

export function CrmShell({ initialLeads }: { initialLeads: Lead[] }) {
  return (
    <ToastProvider>
      <CrmProvider initialLeads={initialLeads}>
        <Inner />
      </CrmProvider>
    </ToastProvider>
  );
}
