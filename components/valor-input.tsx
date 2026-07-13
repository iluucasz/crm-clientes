"use client";

import { useState } from "react";

/**
 * Input de valor (R$) que mantém o texto em estado local enquanto o usuário
 * digita e só confirma a alteração ao sair do campo ou pressionar Enter.
 * Evita disparar uma Server Action a cada tecla.
 */
export function ValorInput({
  id,
  value,
  onCommit,
  className = "num-in",
}: {
  id?: string;
  value: number | null;
  onCommit: (v: number | null) => void;
  className?: string;
}) {
  const [text, setText] = useState(value != null ? String(value) : "");
  // Ressincroniza quando o valor muda por fora (reconciliação do servidor),
  // usando o padrão do React de ajustar estado durante a renderização.
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setText(value != null ? String(value) : "");
  }

  const commit = () => {
    const next = text.trim() === "" ? null : Number(text) || null;
    if (next !== value) onCommit(next);
  };

  return (
    <>
      <input
        id={id}
        type="number"
        className={className}
        placeholder="0,00"
        min="0"
        step="50"
        inputMode="decimal"
        list="valores-sugeridos"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        onClick={(e) => e.stopPropagation()}
      />
      <datalist id="valores-sugeridos">
        <option value="800">Projeto simples / página única</option>
        <option value="1000">Vitrine animada com WhatsApp</option>
        <option value="1200">Vitrine + seções extras</option>
        <option value="1500">Loja com vendas online</option>
        <option value="1800">Loja completa</option>
        <option value="2000">Loja completa + integrações</option>
      </datalist>
    </>
  );
}
