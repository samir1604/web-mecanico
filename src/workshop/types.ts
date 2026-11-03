export type OrderStatus =
  | "Recibido"
  | "En diagnóstico"
  | "Esperando aprobación"
  | "En reparación"
  | "Listo para entrega"
  | "Entregado"
  | "Cancelado"
  | "Rechazado";

export type QuoteStatus =
  | "pendiente"
  | "aprobada"
  | "rechazada"
  | "reemplazada"
  | "vencida";

export interface LineItem {
  concept: string;
  priceCents: number;
  photo?: string;
}

export interface Quote {
  version: number;
  status: QuoteStatus;
  items: LineItem[];
  totalCents: number;
  createdAt: string;
  expiresAt: string;
}

export interface Approval {
  id: string;
  quoteVersion: number;
  items: LineItem[];
  totalCents: number;
  phone: string;
  approvedAt: string;
  ip: string;
  userAgent: string;
}

export interface HistoryEntry {
  at: string;
  from: OrderStatus | null;
  to: OrderStatus;
  author: "dueño" | "cliente" | "sistema";
  note?: string;
}

export interface OrderInput {
  customer: { name: string; phone: string };
  vehicle: { plate: string; make: string; model: string };
  reportedIssue: string;
  internalNotes?: string;
  promisedAt?: string;
}

export interface Order {
  folio: string;
  token: string;
  customer: OrderInput["customer"];
  vehicle: OrderInput["vehicle"];
  reportedIssue: string;
  internalNotes: string;
  promisedAt: string | null;
  status: OrderStatus;
  history: HistoryEntry[];
  quotes: Quote[];
  approvals: Approval[];
  seenAt: string | null;
  createdAt: string;
  deliveredAt: string | null;
  rev: number;
}
