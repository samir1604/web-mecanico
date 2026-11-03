export type OrderStatus =
  | "Recibido"
  | "En diagnóstico"
  | "Esperando aprobación"
  | "En reparación"
  | "Listo para entrega"
  | "Entregado"
  | "Cancelado"
  | "Rechazado";

export const ORDER_STATUSES = [
  "Recibido",
  "En diagnóstico",
  "Esperando aprobación",
  "En reparación",
  "Listo para entrega",
  "Entregado",
  "Cancelado",
  "Rechazado",
] as const satisfies readonly OrderStatus[];

export const isOrderStatus = (value: string): value is OrderStatus =>
  (ORDER_STATUSES as readonly string[]).includes(value);

/** Estados que cierran la orden; solo una corrección explícita los reabre. */
export const TERMINAL_ORDER_STATUSES: readonly OrderStatus[] = [
  "Entregado",
  "Cancelado",
];

export const isTerminalStatus = (status: OrderStatus): boolean =>
  TERMINAL_ORDER_STATUSES.includes(status);

/** Límite de la nota opcional en un cambio de estado. */
export const STATUS_NOTE_MAX_LENGTH = 500;

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

export interface PublicHistoryEntry {
  at: string;
  from: OrderStatus | null;
  to: OrderStatus;
}

/**
 * Proyección segura de una orden para el enlace del cliente. Excluye notas
 * internas, teléfono, token, cotizaciones y cualquier dato de otras órdenes.
 */
export interface PublicOrder {
  folio: string;
  status: OrderStatus;
  vehicle: Order["vehicle"];
  reportedIssue: string;
  promisedAt: string | null;
  createdAt: string;
  history: PublicHistoryEntry[];
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
