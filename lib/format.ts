/** Utilitários puros de formatação e datas (compartilhados cliente/servidor). */

export function brl(v: number | null | undefined): string {
  return (v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

/** Data de hoje em ISO `YYYY-MM-DD` (fuso local). */
export function today(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Formata ISO `YYYY-MM-DD` para `DD/MM/YYYY`. */
export function fmtBR(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

/** Formata um timestamp ISO em data + hora pt-BR. */
export function fmtStamp(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("pt-BR") +
    " " +
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );
}

/**
 * Gera o link do WhatsApp (wa.me) a partir de um texto de telefone.
 * Retorna `null` se o número não for válido.
 */
export function phoneLink(txt: string | null | undefined): string | null {
  const d = (txt || "").replace(/\D/g, "");
  if (d.length < 10 || d.length > 13) return null;
  return "https://wa.me/" + (d.startsWith("55") && d.length >= 12 ? d : "55" + d);
}
