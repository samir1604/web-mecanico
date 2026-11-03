import type { Metadata } from "next";
import type { ReactNode } from "react";

import "../../docs/brand/tokens.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Taller Don Ramiro",
  description:
    "Consulta el estado de tu reparación y aprueba cotizaciones sin llamar al taller.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-MX">
      <body>{children}</body>
    </html>
  );
}
