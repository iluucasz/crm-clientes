import type { NextRequest } from "next/server";
import { getAllLeads } from "@/lib/repository/leads";
import { toCSV } from "@/lib/csv";
import { today } from "@/lib/format";

/**
 * Exporta os leads direto do banco em CSV ou JSON.
 * GET /api/export?format=csv|json
 */
export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get("format") ?? "csv";
  const leads = await getAllLeads();
  const stamp = today();

  if (format === "json") {
    return new Response(JSON.stringify(leads, null, 1), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="backup_crm_${stamp}.json"`,
      },
    });
  }

  return new Response(toCSV(leads), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads_crm_${stamp}.csv"`,
    },
  });
}
