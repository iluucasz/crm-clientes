"use client";

import { useState } from "react";
import { useCrm } from "./crm-context";
import { Modal } from "./modal";
import { PRIORIDADES } from "@/lib/domain";
import type { NewLeadInput, Prioridade } from "@/lib/types";

const EMPTY: NewLeadInput = {
  empresa: "",
  cidade: "",
  segmento: "",
  prioridade: "Média",
  contato: "",
  contato2: "",
  instagram: "",
  site: "",
  temSite: "Não",
  obs: "",
};

export function NewLeadModal({ onClose }: { onClose: () => void }) {
  const { createLead } = useCrm();
  const [form, setForm] = useState<NewLeadInput>(EMPTY);
  const set = (k: keyof NewLeadInput, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.empresa.trim()) return;
    createLead(form);
    onClose();
  };

  return (
    <Modal
      icon="plus"
      title="Novo lead"
      subtitle="Cadastre uma empresa para começar a prospecção"
      onClose={onClose}
      footer={
        <>
          <button className="btn sm" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn sm primary"
            onClick={submit}
            disabled={!form.empresa.trim()}
          >
            Adicionar lead
          </button>
        </>
      }
    >
      <div className="form-section">Identificação</div>
      <div className="dgrid">
        <div className="dfield" style={{ gridColumn: "1 / -1" }}>
          <label>Empresa *</label>
          <input
            autoFocus
            value={form.empresa}
            placeholder="Nome da empresa"
            onChange={(e) => set("empresa", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
          />
        </div>
        <div className="dfield">
          <label>Cidade</label>
          <input
            value={form.cidade}
            onChange={(e) => set("cidade", e.target.value)}
          />
        </div>
        <div className="dfield">
          <label>Segmento</label>
          <input
            value={form.segmento}
            onChange={(e) => set("segmento", e.target.value)}
          />
        </div>
        <div className="dfield">
          <label>Prioridade</label>
          <select
            value={form.prioridade}
            onChange={(e) => set("prioridade", e.target.value as Prioridade)}
          >
            {PRIORIDADES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="dfield">
          <label>Possui site próprio?</label>
          <select
            value={form.temSite}
            onChange={(e) => set("temSite", e.target.value)}
          >
            <option>Não</option>
            <option>Sim</option>
            <option>Não verificado</option>
          </select>
        </div>
      </div>

      <div className="form-section">Contato</div>
      <div className="dgrid">
        <div className="dfield">
          <label>WhatsApp</label>
          <input
            value={form.contato}
            placeholder="(21) 99999-9999"
            onChange={(e) => set("contato", e.target.value)}
          />
        </div>
        <div className="dfield">
          <label>WhatsApp 2</label>
          <input
            value={form.contato2}
            placeholder="(21) 98888-8888"
            onChange={(e) => set("contato2", e.target.value)}
          />
        </div>
        <div className="dfield">
          <label>Instagram</label>
          <input
            value={form.instagram}
            placeholder="https://instagram.com/..."
            onChange={(e) => set("instagram", e.target.value)}
          />
        </div>
        <div className="dfield">
          <label>Site</label>
          <input
            value={form.site}
            placeholder="https://..."
            onChange={(e) => set("site", e.target.value)}
          />
        </div>
      </div>

      <div className="form-section">Observações</div>
      <div className="dfield">
        <textarea
          value={form.obs}
          placeholder="Anotações internas sobre este lead..."
          onChange={(e) => set("obs", e.target.value)}
        />
      </div>
    </Modal>
  );
}
