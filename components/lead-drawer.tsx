"use client";

import { useState } from "react";
import { useCrm } from "./crm-context";
import { Icon } from "./icon";
import { ValorInput } from "./valor-input";
import { PRIORIDADES, STATUSES, stColor } from "@/lib/domain";
import { brl, fmtStamp } from "@/lib/format";

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
  const open = !!lead;

  return (
    <>
      <div
        className={`overlay ${open ? "open" : ""}`}
        onClick={closeDrawer}
      />
      <div className={`drawer ${open ? "open" : ""}`}>
        {lead && (
          <>
            <div
              className="drawer-accent"
              style={{ background: stColor(lead.status) }}
            />
            <div className="drawer-head">
              <div style={{ flex: 1 }}>
                <h2>{lead.empresa}</h2>
                <div className="sub">
                  {lead.cidade || ""} · {lead.segmento || ""} ·{" "}
                  <span style={{ color: stColor(lead.status), fontWeight: 600 }}>
                    {lead.status}
                  </span>
                  {lead.valor ? (
                    <>
                      {" "}
                      ·{" "}
                      <span style={{ color: "var(--green)", fontWeight: 600 }}>
                        {brl(lead.valor)}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
              <button className="ico-btn" onClick={closeDrawer}>
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="drawer-body">
              <div className="dsec">
                <div className="dlinks">
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
                    <button
                      className="btn sm"
                      onClick={() => copyMessage(lead.id)}
                    >
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
              </div>

              <div className="dsec">
                <h4>Gestão</h4>
                <div className="dgrid">
                  <div className="dfield">
                    <label>Status</label>
                    <select
                      className="status-sel"
                      style={{ backgroundColor: stColor(lead.status), width: "100%" }}
                      value={lead.status}
                      onChange={(e) => setStatus(lead.id, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s.id}>{s.id}</option>
                      ))}
                    </select>
                  </div>
                  <div className="dfield">
                    <label>Prioridade</label>
                    <select
                      value={lead.prioridade ?? ""}
                      onChange={(e) => setField(lead.id, "prioridade", e.target.value)}
                    >
                      {PRIORIDADES.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="dfield">
                    <label>Último contato</label>
                    <input
                      type="date"
                      defaultValue={lead.ultimoContato || ""}
                      onBlur={(e) =>
                        setField(lead.id, "ultimoContato", e.target.value || null)
                      }
                    />
                  </div>
                  <div className="dfield">
                    <label>Próximo follow-up</label>
                    <input
                      type="date"
                      defaultValue={lead.followUp || ""}
                      onBlur={(e) =>
                        setField(lead.id, "followUp", e.target.value || null)
                      }
                    />
                  </div>
                  <div className="dfield">
                    <label>Valor do orçamento (R$)</label>
                    <ValorInput
                      value={lead.valor}
                      className="field-input"
                      onCommit={(v) => setField(lead.id, "valor", v)}
                    />
                  </div>
                  <div className="dfield">
                    <label>Responsável</label>
                    <input
                      defaultValue={lead.responsavel || ""}
                      placeholder="Lucas"
                      onBlur={(e) =>
                        setField(lead.id, "responsavel", e.target.value || null)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="dsec">
                <h4>Contato (editável)</h4>
                <div className="dgrid">
                  <div className="dfield">
                    <label>
                      WhatsApp principal{lead.whatsapp ? " — link ativo" : ""}
                    </label>
                    <input
                      defaultValue={lead.contato || ""}
                      key={"c1-" + lead.contato}
                      placeholder="(21) 99999-9999"
                      onBlur={(e) => setPhone(lead.id, 1, e.target.value)}
                    />
                  </div>
                  <div className="dfield">
                    <label>
                      WhatsApp 2 (opcional){lead.whatsapp2 ? " — link ativo" : ""}
                    </label>
                    <input
                      defaultValue={lead.contato2 || ""}
                      key={"c2-" + lead.contato2}
                      placeholder="(21) 98888-8888"
                      onBlur={(e) => setPhone(lead.id, 2, e.target.value)}
                    />
                  </div>
                  <div className="dfield">
                    <label>
                      Instagram
                      {lead.instagram?.startsWith("http") ? " — link ativo" : ""}
                    </label>
                    <input
                      defaultValue={lead.instagram || ""}
                      key={"ig-" + lead.id}
                      placeholder="https://instagram.com/usuario"
                      onBlur={(e) =>
                        setField(lead.id, "instagram", e.target.value || null)
                      }
                    />
                  </div>
                  <div className="dfield">
                    <label>
                      Site{lead.site ? " — link ativo" : ""}
                    </label>
                    <input
                      defaultValue={lead.site || ""}
                      key={"site-" + lead.id}
                      placeholder="https://..."
                      onBlur={(e) =>
                        setField(lead.id, "site", e.target.value || null)
                      }
                    />
                  </div>
                  <div className="dfield">
                    <label>E-mail</label>
                    <input
                      defaultValue={lead.email || ""}
                      key={"email-" + lead.id}
                      placeholder="contato@empresa.com"
                      onBlur={(e) =>
                        setField(lead.id, "email", e.target.value || null)
                      }
                    />
                  </div>
                  <div className="dfield">
                    <label>Endereço</label>
                    <input
                      defaultValue={lead.endereco || ""}
                      key={"end-" + lead.id}
                      onBlur={(e) =>
                        setField(lead.id, "endereco", e.target.value || null)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="dsec">
                <h4>Inteligência</h4>
                <div className="dfield">
                  <label>Situação digital</label>
                  <div className="dval">{lead.situacao || "—"}</div>
                </div>
                <div className="dfield" style={{ marginTop: 8 }}>
                  <label>Oportunidade sugerida</label>
                  <div className="dval">{lead.oportunidade || "—"}</div>
                </div>
                <div className="dfield" style={{ marginTop: 8 }}>
                  <label>Observações</label>
                  <textarea
                    defaultValue={lead.obs || ""}
                    key={"obs-" + lead.id}
                    onBlur={(e) =>
                      setField(lead.id, "obs", e.target.value || null)
                    }
                  />
                </div>
              </div>

              <div className="dsec">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <h4 style={{ margin: 0, flex: 1 }}>Mensagem personalizada</h4>
                  {lead.mensagem && (
                    <button
                      className="btn sm"
                      onClick={() => copyMessage(lead.id)}
                    >
                      <Icon name="copy" size={12} /> Copiar
                    </button>
                  )}
                </div>
                <textarea
                  className="msg-edit"
                  key={"msg-" + lead.id}
                  defaultValue={lead.mensagem || ""}
                  placeholder="Escreva a mensagem que será enviada no WhatsApp deste lead..."
                  onBlur={(e) =>
                    setField(lead.id, "mensagem", e.target.value || null)
                  }
                />
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    marginTop: 6,
                  }}
                >
                  Salva ao sair do campo. É o texto enviado ao clicar em WhatsApp.
                </div>
              </div>

              <div className="dsec">
                <h4>Adicionar anotação</h4>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="field-input"
                    style={{ flex: 1 }}
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
                <h4>Histórico (automático)</h4>
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

              <div className="dsec">
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
          </>
        )}
      </div>
    </>
  );
}
