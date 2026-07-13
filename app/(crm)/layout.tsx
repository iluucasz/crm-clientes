import { CrmShell } from "@/components/crm-shell";
import { getAllLeads } from "@/lib/repository/leads";

export const dynamic = "force-dynamic";

export default async function CrmLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let leads: Awaited<ReturnType<typeof getAllLeads>> = [];

  try {
    leads = await getAllLeads();
  } catch (error) {
    console.error("Falha ao carregar leads no servidor:", error);
  }

  return <CrmShell initialLeads={leads}>{children}</CrmShell>;
}
