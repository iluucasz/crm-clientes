"use client";

import { useCallback, useEffect, useState } from "react";
import { useCrm } from "./crm-context";
import { Icon } from "./icon";
import { ValorInput } from "./valor-input";
import { PRIORIDADES, STATUSES, stColor } from "@/lib/domain";
import { brl, fmtStamp } from "@/lib/format";
import type { LeadField } from "@/lib/repository/leads";

const AUTOSAVE_DELAY = 700;

function AutoSaveInput({
  id,
  value,
  onCommit,
  placeholder,
  type = "text",
  className,
}: {
  id: string;
  value: string | null | undefined;
  onCommit: (value: string) => void;
  placeholder?: string;
  type?: "text" | "date" | "email" | "url" | "tel";
  className?: string;
}) {
  const normalized = value ?? "";
  const [text, setText] = useState(normalized);
  const [lastValue, setLastValue] = useState(normalized);

  if (normalized !== lastValue) {
    setLastValue(normalized);
    setText(normalized);
  }

  const commit = useCallback(
    (next = text) => {
      if (next !== normalized) onCommit(next);
    },
    [normalized, onCommit, text]
  );

  useEffect(() => {
    if (text === normalized) return;
    const timer = window.setTimeout(() => commit(text), AUTOSAVE_DELAY);
    return () => window.clearTimeout(timer);
  }, [commit, normalized, text]);

  return (
    <input
      id={id}
      type={type}
      className={className}
      value={text}
      placeholder={placeholder}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => commit()}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          commit(e.currentTarget.value);
          e.currentTarget.blur();
        }
      }}
    />
  );
}

function AutoSaveTextarea({
  id,
  value,
  onCommit,
  placeholder,
  className,
}: {
  id: string;
  value: string | null | undefined;
  onCommit: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const normalized = value ?? "";
  const [text, setText] = useState(normalized);
  const [lastValue, setLastValue] = useState(normalized);

  if (normalized !== lastValue) {
    setLastValue(normalized);
    setText(normalized);
  }

  const commit = useCallback(
    (next = text) => {
      if (next !== normalized) onCommit(next);
    },
    [normalized, onCommit, text]
  );

  useEffect(() => {
    if (text === normalized) return;
    const timer = window.setTimeout(() => commit(text), AUTOSAVE_DELAY);
    return () => window.clearTimeout(timer);
  }, [commit, normalized, text]);

  return (
    <textarea
      id={id}
      className={className}
      value={text}
      placeholder={placeholder}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => commit()}
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          commit(e.currentTarget.value);
          e.currentTarget.blur();
        }
      }}
    />
  );
}

export function LeadDrawer() {
  const {
    leads,
    openId,
    closeDrawer,
    setStatus,
    setField,
    setPhone,
    addNote,
    deleteLead,
    openWhatsApp,
    copyMessage,
  } = useCrm();
  const [note, setNote] = useState("");
  const lead = leads.find((l) => l.id === openId) || null;

  useEffect(() => {
    if (!lead) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lead, closeDrawer]);

  const commitField = useCallback(
    (id: number, field: LeadField, value: string) => {
      setField(id, field, value || null);
    },
    [setField]
  );

  if (!lead) return null;

  const fieldId = (name: string) => `lead-${lead.id}-${name}`;
  const statusColor = stColor(lead.status);

  const sendOffer = () => {
    if (!lead.whatsapp || !lead.oferta) return;
    window.open(
      `${lead.whatsapp}?text=${encodeURIComponent(lead.oferta)}`,
      "_blank"
    );
  };

  return (
    <div className="modal" onClick={closeDrawer}>
      <div
        className="modal-box lead-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lead-modal-head">
          <div className="lead-title-block">
            <div className="lead-kicker">ID #{lead.id}</div>
            <div className="lead-title-row">
              <h2>{lead.empresa}</h2>
              <span
                className="lead-status-chip"
                style={{
                  borderColor: `${statusColor}70`,
                  color: statusColor,
                  backgroundColor: `${statusColor}18`,
                }}
              >
                {lead.status}
              </span>
              {lead.valor ? (
                <span className="lead-value-chip">{brl(lead.valor)}</span>
              ) : null}
            </div>
            <div className="lead-meta-row">
              {lead.cidade && <span>{lead.cidade}</span>}
              {lead.segmento && <span>{lead.segmento}</span>}
              {lead.responsavel && <span>Resp. {lead.responsavel}</span>}
            </div>
          </div>
          <button className="ico-btn" onClick={closeDrawer} title="Fechar (Esc)">
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="drawer-body">
          <div className="lead-actions">
            {lead.whatsapp && (
              <button
                className="btn sm primary"
                onClick={() => openWhatsApp(lead.id, 1)}
              >
                <Icon name="chat" size={13} /> WhatsApp
                {lead.whatsapp2 ? " 1" : ""}
              </button>
            )}
            {lead.whatsapp2 && (
              <button
                className="btn sm primary"
                onClick={() => openWhatsApp(lead.id, 2)}
              >
                <Icon name="chat" size={13} /> WhatsApp 2
              </button>
            )}
            {lead.mensagem && (
              <button className="btn sm" onClick={() => copyMessage(lead.id)}>
                <Icon name="copy" size={13} /> Copiar mensagem
              </button>
            )}
            {lead.instagram?.startsWith("http") && (
              <a
                className="btn sm"
                href={lead.instagram}
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="insta" size={13} /> Instagram
              </a>
            )}
            {lead.site && (
              <a
                className="btn sm"
                href={lead.site}
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="globe" size={13} /> Site
              </a>
            )}
          </div>

          <div className="dsec">
            <h4>Gestão</h4>
            <div className="dgrid">
              <div className="dfield">
                <label htmlFor={fieldId("status")}>Status</label>
                <select
                  id={fieldId("status")}
                  className="status-select-soft"
                  style={{ borderColor: `${statusColor}80`, color: statusColor }}
                  value={lead.status}
                  onChange={(e) => setStatus(lead.id, e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <option key={s.id}>{s.id}</option>
                  ))}
                </select>
              </div>
              <div className="dfield">
                <label htmlFor={fieldId("prioridade")}>Prioridade</label>
                <select
                  id={fieldId("prioridade")}
                  value={lead.prioridade ?? ""}
                  onChange={(e) =>
                    setField(lead.id, "prioridade", e.target.value)
                  }
                >
                  {PRIORIDADES.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="dfield">
                <label htmlFor={fieldId("ultimo-contato")}>Último contato</label>
                <AutoSaveInput
                  id={fieldId("ultimo-contato")}
                  type="date"
                  value={lead.ultimoContato}
                  onCommit={(value) =>
                    commitField(lead.id, "ultimoContato", value)
                  }
                />
              </div>
              <div className="dfield">
                <label htmlFor={fieldId("follow-up")}>Próximo follow-up</label>
                <AutoSaveInput
                  id={fieldId("follow-up")}
                  type="date"
                  value={lead.followUp}
                  onCommit={(value) => commitField(lead.id, "followUp", value)}
                />
              </div>
              <div className="dfield">
                <label htmlFor={fieldId("valor")}>Valor do orçamento (R$)</label>
                <ValorInput
                  id={fieldId("valor")}
                  value={lead.valor}
                  className="field-input"
                  onCommit={(v) => setField(lead.id, "valor", v)}
                />
              </div>
              <div className="dfield">
                <label htmlFor={fieldId("responsavel")}>Responsável</label>
                <AutoSaveInput
                  id={fieldId("responsavel")}
                  value={lead.responsavel}
                  placeholder="Lucas"
                  onCommit={(value) =>
                    commitField(lead.id, "responsavel", value)
                  }
                />
              </div>
            </div>
          </div>

          <div className="dsec">
            <h4>Contato</h4>
            <div className="dgrid">
              <div className="dfield">
                <label htmlFor={fieldId("whatsapp")}>
                  WhatsApp principal{lead.whatsapp ? " - link ativo" : ""}
                </label>
                <AutoSaveInput
                  id={fieldId("whatsapp")}
                  type="tel"
                  value={lead.contato}
                  placeholder="(21) 99999-9999"
                  onCommit={(value) => setPhone(lead.id, 1, value)}
                />
              </div>
              <div className="dfield">
                <label htmlFor={fieldId("whatsapp-2")}>
                  WhatsApp 2{lead.whatsapp2 ? " - link ativo" : ""}
                </label>
                <AutoSaveInput
                  id={fieldId("whatsapp-2")}
                  type="tel"
                  value={lead.contato2}
                  placeholder="(21) 98888-8888"
                  onCommit={(value) => setPhone(lead.id, 2, value)}
                />
              </div>
              <div className="dfield">
                <label htmlFor={fieldId("instagram")}>
                  Instagram
                  {lead.instagram?.startsWith("http") ? " - link ativo" : ""}
                </label>
                <AutoSaveInput
                  id={fieldId("instagram")}
                  type="url"
                  value={lead.instagram}
                  placeholder="https://instagram.com/usuario"
                  onCommit={(value) => commitField(lead.id, "instagram", value)}
                />
              </div>
              <div className="dfield">
                <label htmlFor={fieldId("site")}>
                  Site{lead.site ? " - link ativo" : ""}
                </label>
                <AutoSaveInput
                  id={fieldId("site")}
                  type="url"
                  value={lead.site}
                  placeholder="https://..."
                  onCommit={(value) => commitField(lead.id, "site", value)}
                />
              </div>
              <div className="dfield">
                <label htmlFor={fieldId("email")}>E-mail</label>
                <AutoSaveInput
                  id={fieldId("email")}
                  type="email"
                  value={lead.email}
                  placeholder="contato@empresa.com"
                  onCommit={(value) => commitField(lead.id, "email", value)}
                />
              </div>
              <div className="dfield">
                <label htmlFor={fieldId("endereco")}>Endereço</label>
                <AutoSaveInput
                  id={fieldId("endereco")}
                  value={lead.endereco}
                  onCommit={(value) => commitField(lead.id, "endereco", value)}
                />
              </div>
            </div>
          </div>

          <div className="dsec">
            <h4>Inteligência</h4>
            <div className="lead-info-grid">
              <div className="dfield">
                <label>Situação digital</label>
                <div className="dval">{lead.situacao || "—"}</div>
              </div>
              <div className="dfield">
                <label>Oportunidade sugerida</label>
                <div className="dval">{lead.oportunidade || "—"}</div>
              </div>
            </div>
            <div className="dfield lead-full-field">
              <label htmlFor={fieldId("obs")}>Observações</label>
              <AutoSaveTextarea
                id={fieldId("obs")}
                value={lead.obs}
                onCommit={(value) => commitField(lead.id, "obs", value)}
              />
            </div>
          </div>

          <div className="dsec">
            <div className="section-row">
              <h4>Mensagem personalizada</h4>
              {lead.mensagem && (
                <button className="btn sm" onClick={() => copyMessage(lead.id)}>
                  <Icon name="copy" size={12} /> Copiar
                </button>
              )}
            </div>
            <AutoSaveTextarea
              id={fieldId("mensagem")}
              className="msg-edit"
              value={lead.mensagem}
              placeholder="Escreva a mensagem que será enviada no WhatsApp deste lead..."
              onCommit={(value) => commitField(lead.id, "mensagem", value)}
            />
          </div>

          <div className="dsec">
            <div className="section-row">
              <h4>
                Oferta / valores{" "}
                <span>(quando perguntam &ldquo;quanto custa e como faço?&rdquo;)</span>
              </h4>
              {lead.oferta && (
                <button
                  className="btn sm"
                  onClick={() => navigator.clipboard.writeText(lead.oferta || "")}
                >
                  <Icon name="copy" size={12} /> Copiar
                </button>
              )}
              {lead.whatsapp && lead.oferta && (
                <button className="btn sm primary" onClick={sendOffer}>
                  <Icon name="chat" size={12} /> Enviar
                </button>
              )}
            </div>
            <AutoSaveTextarea
              id={fieldId("oferta")}
              className="msg-edit"
              value={lead.oferta}
              placeholder="Descreva valores, prazos e como funciona o seu processo..."
              onCommit={(value) => commitField(lead.id, "oferta", value)}
            />
          </div>

          <div className="dsec">
            <h4>Adicionar anotação</h4>
            <div className="lead-note-row">
              <input
                className="field-input"
                value={note}
                placeholder="Ex.: ligou de volta, pediu desconto, aceitou proposta..."
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addNote(lead.id, note);
                    setNote("");
                  }
                }}
              />
              <button
                className="btn sm primary"
                onClick={() => {
                  addNote(lead.id, note);
                  setNote("");
                }}
              >
                Salvar
              </button>
            </div>
          </div>

          <div className="dsec">
            <h4>Histórico</h4>
            <div className="hist">
              {lead.historico.length ? (
                lead.historico.slice(0, 25).map((h) => (
                  <div className="hi" key={h.id}>
                    <div className="ht">{fmtStamp(h.criadoEm)}</div>
                    {h.texto}
                  </div>
                ))
              ) : (
                "—"
              )}
            </div>
          </div>

          <div className="dsec lead-danger-zone">
            <button
              className="btn sm danger"
              onClick={() => {
                if (confirm(`Excluir "${lead.empresa}"?`)) deleteLead(lead.id);
              }}
            >
              <Icon name="trash" size={13} /> Excluir lead
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
