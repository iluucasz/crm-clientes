import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM de Leads — Lucas | dev-lss",
  description:
    "CRM de leads com pipeline, follow-ups automáticos e disparo de WhatsApp.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
