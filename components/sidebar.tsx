"use client";

import { useCrm, type View } from "./crm-context";
import { Icon, type IconName } from "./icon";
import { pendingFollowUps } from "@/lib/selectors";

const NAV: { view: View; label: string; icon: IconName }[] = [
  { view: "dashboard", label: "Dashboard", icon: "dashboard" },
  { view: "leads", label: "Leads", icon: "users" },
  { view: "pipeline", label: "Pipeline", icon: "pipeline" },
  { view: "followups", label: "Follow-ups", icon: "clock" },
];

export function Sidebar({
  onImport,
  onExport,
}: {
  onImport: () => void;
  onExport: () => void;
}) {
  const { view, setView, leads } = useCrm();
  const pending = pendingFollowUps(leads);

  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="ic">
          <Icon name="bolt" size={18} />
        </div>
        <div>
          <b>CRM Leads</b>
          <span>dev-lss.com</span>
        </div>
      </div>

      {NAV.map((n) => (
        <button
          key={n.view}
          className={`nav-item ${view === n.view ? "active" : ""}`}
          onClick={() => setView(n.view)}
        >
          <Icon name={n.icon} />
          <span className="tx">{n.label}</span>
          {n.view === "followups" && pending > 0 && (
            <span className="badge">{pending}</span>
          )}
        </button>
      ))}

      <div className="spacer" />
      <div className="sep" />
      <button className="nav-item" onClick={onImport}>
        <Icon name="import" />
        <span className="tx">Importar leads</span>
      </button>
      <button className="nav-item" onClick={onExport}>
        <Icon name="export" />
        <span className="tx">Exportar / Backup</span>
      </button>
      <div className="side-foot">
        Feito para <b>Lucas</b>
        <br />
        <span>{leads.length} leads no banco</span>
      </div>
    </aside>
  );
}
