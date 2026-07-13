import { getAllLeads } from "@/lib/repository/leads";
import { CrmShell } from "@/components/crm-shell";

// Sempre renderiza com dados atuais do banco (sem cache estático).
export const dynamic = "force-dynamic";

export default async function Home() {
  const leads = await getAllLeads();
  return <CrmShell initialLeads={leads} />;
}
