"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import type { Lead } from "@/lib/types";
import { CrmProvider, useCrm } from "./crm-context";
import { ToastProvider } from "./toast";
import { Sidebar } from "./sidebar";
import { LeadDrawer } from "./lead-drawer";
import { NewLeadModal } from "./new-lead-modal";
import { ImportModal, ExportModal } from "./data-modals";
import { Icon } from "./icon";

const TITLES: Record<string, { title: string; sub: string }> = {
  "/dashboard": { title: "Dashboard", sub: "Visão geral da prospecção" },
  "/leads": { title: "Leads", sub: "Base completa e edição rápida" },
  "/pipeline": { title: "Pipeline", sub: "Oportunidades por etapa comercial" },
  "/followups": { title: "Follow-ups", sub: "Agenda de retornos e pendências" },
};

type Modal = null | "new" | "import" | "export";

function Inner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { filters, patchFilters } = useCrm();
  const [modal, setModal] = useState<Modal>(null);
  const meta = TITLES[pathname] ?? TITLES["/dashboard"];

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

        <main className="content">{children}</main>
      </div>

      <LeadDrawer />
      {modal === "new" && <NewLeadModal onClose={() => setModal(null)} />}
      {modal === "import" && <ImportModal onClose={() => setModal(null)} />}
      {modal === "export" && <ExportModal onClose={() => setModal(null)} />}
    </div>
  );
}

export function CrmShell({
  initialLeads,
  children,
}: {
  initialLeads: Lead[];
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <CrmProvider initialLeads={initialLeads}>
        <Inner>{children}</Inner>
      </CrmProvider>
    </ToastProvider>
  );
}
