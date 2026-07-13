import { getAllLeads } from "@/lib/repository/leads";
import { CrmShell } from "@/components/crm-shell";

// Sempre renderiza com dados atuais do banco (sem cache estático).
export const dynamic = "force-dynamic";

export default async function Home() {
  // Se a 1ª conexão ao banco falhar (cold start), não quebra a página:
  // entrega vazia e o cliente busca os dados sozinho (sem recarregar).
  let leads: Awaited<ReturnType<typeof getAllLeads>> = [];
  try {
    leads = await getAllLeads();
  } catch (e) {
    console.error("Falha ao carregar leads no servidor:", e);
  }
  return <CrmShell initialLeads={leads} />;
}
