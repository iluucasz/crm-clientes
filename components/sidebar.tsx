"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCrm } from "./crm-context";
import { Icon, type IconName } from "./icon";
import { pendingFollowUps } from "@/lib/selectors";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/leads", label: "Leads", icon: "users" },
  { href: "/pipeline", label: "Pipeline", icon: "pipeline" },
  { href: "/followups", label: "Follow-ups", icon: "clock" },
];

export function Sidebar({
  onImport,
  onExport,
}: {
  onImport: () => void;
  onExport: () => void;
}) {
  const pathname = usePathname();
  const { leads } = useCrm();
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
        <Link
          key={n.href}
          href={n.href}
          className={`nav-item ${pathname === n.href ? "active" : ""}`}
          aria-current={pathname === n.href ? "page" : undefined}
        >
          <Icon name={n.icon} />
          <span className="tx">{n.label}</span>
          {n.href === "/followups" && pending > 0 && (
            <span className="badge">{pending}</span>
          )}
        </Link>
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
