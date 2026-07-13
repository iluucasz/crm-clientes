"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import type { Lead, NewLeadInput } from "@/lib/types";
import type { LeadField } from "@/lib/repository/leads";
import { defaultFilters, type Filters } from "@/lib/selectors";
import {
  addDays,
  brl,
  fmtBR,
  phoneLink,
  today,
  withCurrentGreeting,
} from "@/lib/format";
import { CLOSED, statusConfig, stColor } from "@/lib/domain";
import * as actions from "@/app/actions/leads";
import { useToast } from "./toast";

export type View = "dashboard" | "leads" | "pipeline" | "followups";

interface CrmContextValue {
  leads: Lead[];
  filters: Filters;
  patchFilters: (p: Partial<Filters>) => void;
  clearFilters: () => void;
  sortBy: (key: keyof Lead) => void;
  view: View;
  setView: (v: View) => void;
  openId: number | null;
  openDrawer: (id: number) => void;
  closeDrawer: () => void;
  pending: boolean;
  setStatus: (id: number, status: string) => void;
  setField: (id: number, field: LeadField, value: string | number | null) => void;
  setPhone: (id: number, which: 1 | 2, value: string) => void;
  markContact: (id: number) => void;
  addNote: (id: number, texto: string) => void;
  snooze: (id: number) => void;
  createLead: (input: NewLeadInput) => void;
  deleteLead: (id: number) => void;
  openWhatsApp: (id: number, which?: 1 | 2) => void;
  copyMessage: (id: number) => void;
  importLeads: (rows: Array<Record<string, unknown>>) => void;
  replaceAll: (leads: Lead[]) => void;
}

const Ctx = createContext<CrmContextValue | null>(null);

export function useCrm() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCrm must be used within CrmProvider");
  return v;
}

export function CrmProvider({
  initialLeads,
  children,
}: {
  initialLeads: Lead[];
  children: React.ReactNode;
}) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [view, setView] = useState<View>("dashboard");
  const [openId, setOpenId] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  // Rede de segurança: se a página inicial vier sem leads (ex.: cold start no
  // servidor), busca os dados no cliente sem precisar recarregar a página.
  useEffect(() => {
    if (initialLeads.length === 0) {
      actions.listLeads().then((fresh) => {
        if (fresh.length) setLeads(fresh);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const replaceLead = useCallback((updated: Lead | null) => {
    if (!updated) return;
    setLeads((prev) =>
      prev.some((l) => l.id === updated.id)
        ? prev.map((l) => (l.id === updated.id ? updated : l))
        : [...prev, updated]
    );
  }, []);

  /** Aplica uma alteração parcial imediatamente (atualização otimista). */
  const patchLeadLocal = useCallback(
    (id: number, partial: Partial<Lead>) => {
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...partial } : l))
      );
    },
    []
  );

  const patchFilters = useCallback(
    (p: Partial<Filters>) => setFilters((f) => ({ ...f, ...p })),
    []
  );
  const clearFilters = useCallback(() => setFilters(defaultFilters), []);
  const sortBy = useCallback(
    (key: keyof Lead) =>
      setFilters((f) => ({
        ...f,
        sortDir: f.sortKey === key ? ((-f.sortDir) as 1 | -1) : 1,
        sortKey: key,
      })),
    []
  );

  const openDrawer = useCallback((id: number) => setOpenId(id), []);
  const closeDrawer = useCallback(() => setOpenId(null), []);

  const setStatus = useCallback(
    (id: number, status: string) => {
      const lead = leads.find((l) => l.id === id);
      if (!lead || lead.status === status) return;

      // Reproduz a automação localmente para feedback instantâneo.
      const cfg = statusConfig(status);
      let followUp = lead.followUp;
      if (cfg.fuDays != null) followUp = addDays(today(), cfg.fuDays);
      else if (CLOSED.includes(status)) followUp = null;
      patchLeadLocal(id, { status, ultimoContato: today(), followUp });

      let extra = "";
      if (status === "Fechado" && lead.valor)
        extra = ` — ${brl(lead.valor)} ganhos`;
      else if (followUp && followUp !== lead.followUp)
        extra = `, follow-up ${fmtBR(followUp)}`;
      toast(
        `<b>${lead.empresa}</b> — status alterado para <b style="color:${stColor(
          status
        )}">${status}</b>${extra}.`
      );

      startTransition(async () => {
        replaceLead(await actions.setStatus(id, status));
      });
    },
    [leads, patchLeadLocal, replaceLead, toast]
  );

  const setField = useCallback(
    (id: number, field: LeadField, value: string | number | null) => {
      patchLeadLocal(id, { [field]: value } as Partial<Lead>);
      startTransition(async () => {
        replaceLead(await actions.setField(id, field, value));
      });
    },
    [patchLeadLocal, replaceLead]
  );

  const setPhone = useCallback(
    (id: number, which: 1 | 2, value: string) => {
      const link = phoneLink(value);
      patchLeadLocal(
        id,
        which === 2
          ? { contato2: value || null, whatsapp2: link }
          : { contato: value || null, whatsapp: link }
      );
      startTransition(async () => {
        replaceLead(await actions.setPhone(id, which, value));
      });
      toast(
        link
          ? `Número salvo — link do WhatsApp ${which === 2 ? "2 " : ""}gerado`
          : "Número salvo",
        "info"
      );
    },
    [patchLeadLocal, replaceLead, toast]
  );

  const markContact = useCallback(
    (id: number) => {
      const lead = leads.find((l) => l.id === id);
      patchLeadLocal(id, { ultimoContato: today() });
      startTransition(async () => {
        replaceLead(await actions.markContactToday(id));
      });
      if (lead)
        toast(`<b>${lead.empresa}</b> — contato de hoje registrado.`, "info");
    },
    [leads, patchLeadLocal, replaceLead, toast]
  );

  const addNote = useCallback(
    (id: number, texto: string) => {
      if (!texto.trim()) return;
      startTransition(async () => {
        replaceLead(await actions.addNote(id, texto));
        toast("Anotação registrada no histórico", "info");
      });
    },
    [replaceLead, toast]
  );

  const snooze = useCallback(
    (id: number) => {
      const lead = leads.find((l) => l.id === id);
      if (!lead) return;
      const base =
        lead.followUp && lead.followUp > today() ? lead.followUp : today();
      const followUp = addDays(base, 2);
      patchLeadLocal(id, { followUp });
      startTransition(async () => {
        replaceLead(await actions.snooze(id));
      });
      toast(
        `<b>${lead.empresa}</b> — follow-up adiado para ${fmtBR(followUp)}`,
        "info"
      );
    },
    [leads, patchLeadLocal, replaceLead, toast]
  );

  const createLead = useCallback(
    (input: NewLeadInput) => {
      if (!input.empresa.trim()) {
        toast("Informe o nome da empresa", "err");
        return;
      }
      startTransition(async () => {
        replaceLead(await actions.createLead(input));
        toast("Novo lead adicionado");
      });
    },
    [replaceLead, toast]
  );

  const deleteLead = useCallback(
    (id: number) => {
      const lead = leads.find((l) => l.id === id);
      startTransition(async () => {
        await actions.deleteLead(id);
        setLeads((prev) => prev.filter((l) => l.id !== id));
        setOpenId((cur) => (cur === id ? null : cur));
        if (lead) toast(`Lead <b>${lead.empresa}</b> excluído`, "warn");
      });
    },
    [leads, toast]
  );

  const openWhatsApp = useCallback(
    (id: number, which: 1 | 2 = 1) => {
      const lead = leads.find((l) => l.id === id);
      if (!lead) return;
      const wa = which === 2 ? lead.whatsapp2 : lead.whatsapp;
      if (!wa) return;
      const url = lead.mensagem
        ? `${wa}?text=${encodeURIComponent(withCurrentGreeting(lead.mensagem))}`
        : wa;
      window.open(url, "_blank");
      startTransition(async () => {
        replaceLead(await actions.logWhatsApp(id));
      });
    },
    [leads, replaceLead]
  );

  const copyMessage = useCallback(
    (id: number) => {
      const lead = leads.find((l) => l.id === id);
      if (!lead?.mensagem) return;
      navigator.clipboard
        .writeText(withCurrentGreeting(lead.mensagem))
        .then(() => toast(`Mensagem de <b>${lead.empresa}</b> copiada`, "info"))
        .catch(() => toast("Não foi possível copiar", "err"));
    },
    [leads, toast]
  );

  const importLeads = useCallback(
    (rows: Array<Record<string, unknown>>) => {
      startTransition(async () => {
        const res = await actions.importLeads(rows);
        setLeads(res.leads);
        toast(
          `Importação: <b>${res.added}</b> novos leads, ${res.skipped} duplicados ignorados`
        );
      });
    },
    [toast]
  );

  const replaceAll = useCallback((next: Lead[]) => setLeads(next), []);

  const value = useMemo<CrmContextValue>(
    () => ({
      leads,
      filters,
      patchFilters,
      clearFilters,
      sortBy,
      view,
      setView,
      openId,
      openDrawer,
      closeDrawer,
      pending,
      setStatus,
      setField,
      setPhone,
      markContact,
      addNote,
      snooze,
      createLead,
      deleteLead,
      openWhatsApp,
      copyMessage,
      importLeads,
      replaceAll,
    }),
    [
      leads,
      filters,
      patchFilters,
      clearFilters,
      sortBy,
      view,
      openId,
      openDrawer,
      closeDrawer,
      pending,
      setStatus,
      setField,
      setPhone,
      markContact,
      addNote,
      snooze,
      createLead,
      deleteLead,
      openWhatsApp,
      copyMessage,
      importLeads,
      replaceAll,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
