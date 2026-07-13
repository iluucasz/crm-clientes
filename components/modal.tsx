"use client";

import { useEffect } from "react";
import { Icon, type IconName } from "./icon";

/** Casca padrão de modal: cabeçalho com ícone/título, corpo rolável e rodapé. */
export function Modal({
  icon,
  title,
  subtitle,
  onClose,
  children,
  footer,
  width,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}) {
  // Fecha com a tecla Esc.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal" onClick={onClose}>
      <div
        className="modal-box"
        style={width ? { width } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div className="modal-icon">
            <Icon name={icon} size={19} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2>{title}</h2>
            {subtitle && <div className="modal-sub">{subtitle}</div>}
          </div>
          <button className="ico-btn modal-close" onClick={onClose} title="Fechar">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}
