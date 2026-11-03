import { randomBytes } from "node:crypto";

import { seedDemo } from "./demo-seed";
import { DomainError } from "./errors";
import { RevisionConflict, type Clock, type Store } from "./ports";
import {
  isOrderStatus,
  isTerminalStatus,
  type Approval,
  type LineItem,
  type Order,
  type OrderInput,
  type OrderStatus,
  type PublicApproval,
  type PublicOrder,
  type Quote,
} from "./types";

const QUOTE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const PUBLIC_LINK_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

export interface WorkshopDeps {
  store: Store;
  clock: Clock;
  /** Inyectable para tests; en producción, 32 bytes aleatorios en base64url. */
  ids?: { token?: () => string };
}

function assertItems(items: LineItem[]): void {
  if (!Array.isArray(items) || items.length === 0) {
    throw new DomainError(
      "VALIDATION",
      "La cotización necesita al menos una partida.",
    );
  }
  for (const item of items) {
    if (!item.concept?.trim()) {
      throw new DomainError("VALIDATION", "Cada partida necesita un concepto.");
    }
    if (!Number.isInteger(item.priceCents) || item.priceCents < 0) {
      throw new DomainError(
        "VALIDATION",
        "El precio debe ser un entero de centavos no negativo.",
      );
    }
  }
}

const totalOf = (items: LineItem[]): number =>
  items.reduce((sum, item) => sum + item.priceCents, 0);

const isExpired = (quote: Quote, now: Date): boolean =>
  now.getTime() >= new Date(quote.expiresAt).getTime();

/** La cotización vigente es la última pendiente que aún no vence. */
const activePendingQuote = (order: Order, now: Date): Quote | undefined =>
  [...order.quotes]
    .reverse()
    .find(
      (quote) => quote.status === "pendiente" && !isExpired(quote, now),
    );

const normalizeSearch = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const plateSearchKey = (value: string): string =>
  normalizeSearch(value).replace(/[^a-z0-9]/g, "");

/**
 * El enlace sigue vivo hasta 30 días después de la entrega. `deliveredAt` se
 * limpia al corregir la orden, así que una orden terminal recupera la última
 * entrega del historial para no dejar el enlace vivo indefinidamente.
 */
function assertLinkAlive(order: Order, now: Date): void {
  const deliveredAt =
    order.deliveredAt ??
    (isTerminalStatus(order.status)
      ? ([...order.history]
          .reverse()
          .find((entry) => entry.to === "Entregado")?.at ?? null)
      : null);

  if (
    deliveredAt &&
    now.getTime() >=
      new Date(deliveredAt).getTime() + PUBLIC_LINK_LIFETIME_MS
  ) {
    throw new DomainError(
      "LINK_EXPIRED",
      "El enlace venció. Pide al taller un enlace nuevo.",
    );
  }
}

const publicItems = (items: LineItem[]) =>
  items.map(({ concept, priceCents }) => ({ concept, priceCents }));

const publicApprovalOf = (order: Order): PublicApproval | null => {
  const latest = order.approvals.at(-1);
  if (!latest) return null;

  return {
    id: latest.id,
    quoteVersion: latest.quoteVersion,
    items: publicItems(latest.items),
    totalCents: latest.totalCents,
    approvedAt: latest.approvedAt,
  };
};

/** Recorta datos de la petición para que no crezcan sin límite en el documento. */
const cleanEvidence = (value: string, maxLength: number, fallback: string) =>
  value.trim().slice(0, maxLength) || fallback;

export function createWorkshop({ store, clock, ids }: WorkshopDeps) {
  const newToken = ids?.token ?? (() => randomBytes(32).toString("base64url"));

  async function load(folio: string): Promise<Order> {
    const order = await store.getByFolio(folio);
    if (!order) {
      throw new DomainError("NOT_FOUND", "Orden no encontrada.");
    }
    return order;
  }

  async function persist(order: Order, expectedRev: number): Promise<void> {
    try {
      await store.save(order, expectedRev);
    } catch (error) {
      if (error instanceof RevisionConflict) {
        throw new DomainError(
          "VERSION_CONFLICT",
          "La orden cambió, recarga antes de continuar.",
        );
      }
      throw error;
    }
  }

  function buildQuote(order: Order, items: LineItem[]): Quote {
    const now = clock.now();
    return {
      version: order.quotes.length + 1,
      status: "pendiente",
      items: structuredClone(items),
      totalCents: totalOf(items),
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + QUOTE_LIFETIME_MS).toISOString(),
    };
  }

  const workshop = {
    async createOrder(input: OrderInput): Promise<Order> {
      const now = clock.now();
      const folio = await store.nextFolio();

      const order: Order = {
        folio,
        token: newToken(),
        customer: input.customer,
        vehicle: input.vehicle,
        reportedIssue: input.reportedIssue,
        internalNotes: input.internalNotes ?? "",
        promisedAt: input.promisedAt ?? null,
        status: "Recibido",
        history: [
          { at: now.toISOString(), from: null, to: "Recibido", author: "dueño" },
        ],
        quotes: [],
        approvals: [],
        seenAt: null,
        createdAt: now.toISOString(),
        deliveredAt: null,
        rev: 1,
      };

      await store.create(order);
      return order;
    },

    async findByToken(token: string): Promise<Order | null> {
      return store.getByToken(token);
    },

    /**
     * Vista pública del enlace del cliente. Un token desconocido y uno vencido
     * fallan con mensajes distintos, pero ninguno revela datos de la orden.
     */
    async publicOrderByToken(token: string): Promise<PublicOrder> {
      const order = await store.getByToken(token);
      if (!order) {
        throw new DomainError("NOT_FOUND", "Enlace no válido.");
      }

      const now = clock.now();
      assertLinkAlive(order, now);

      const pending = activePendingQuote(order, now);

      return {
        folio: order.folio,
        status: order.status,
        vehicle: order.vehicle,
        reportedIssue: order.reportedIssue,
        promisedAt: order.promisedAt,
        createdAt: order.createdAt,
        history: order.history.map(({ at, from, to }) => ({ at, from, to })),
        quote: pending
          ? {
              version: pending.version,
              items: publicItems(pending.items),
              totalCents: pending.totalCents,
              createdAt: pending.createdAt,
              expiresAt: pending.expiresAt,
            }
          : null,
        approval: publicApprovalOf(order),
      };
    },

    async findByFolio(folio: string): Promise<Order | null> {
      return store.getByFolio(folio);
    },

    async findActiveQuote(folio: string): Promise<Quote | null> {
      const order = await load(folio);
      const quote = activePendingQuote(order, clock.now());
      return quote ? structuredClone(quote) : null;
    },

    async listOrders(): Promise<Order[]> {
      return store.list();
    },

    /**
     * Consulta del tablero: por nombre del cliente o placa. Ignora acentos,
     * mayúsculas y separadores de placa (`ABC-123` coincide con `abc123`).
     */
    async searchOrders(query: string): Promise<Order[]> {
      const orders = await store.list();
      const term = normalizeSearch(query);
      if (!term) return orders;

      const plateTerm = plateSearchKey(query);

      return orders.filter(
        (order) =>
          normalizeSearch(order.customer.name).includes(term) ||
          (plateTerm.length > 0 &&
            plateSearchKey(order.vehicle.plate).includes(plateTerm)),
      );
    },

    async changeStatus(
      folio: string,
      status: OrderStatus,
      note?: string,
      options: { correction?: boolean } = {},
    ): Promise<Order> {
      if (!isOrderStatus(status)) {
        throw new DomainError("VALIDATION", "Elige un estado válido.");
      }

      const order = await load(folio);

      if (order.status === status) {
        throw new DomainError(
          "VALIDATION",
          `La orden ya está en «${status}».`,
        );
      }

      if (isTerminalStatus(order.status) && !options.correction) {
        throw new DomainError(
          "INVALID_TRANSITION",
          `La orden está en «${order.status}». Confirma una corrección manual para cambiar el estado.`,
        );
      }

      const now = clock.now();
      const expectedRev = order.rev;
      const from = order.status;
      const cleanNote = note?.trim();

      order.status = status;
      if (status === "Entregado") {
        order.deliveredAt = now.toISOString();
      } else if (from === "Entregado") {
        order.deliveredAt = null;
      }
      order.rev = expectedRev + 1;
      order.history.push({
        at: now.toISOString(),
        from,
        to: status,
        author: "dueño",
        ...(cleanNote ? { note: cleanNote } : {}),
      });

      await persist(order, expectedRev);
      return structuredClone(order);
    },

    async createQuote(folio: string, items: LineItem[]): Promise<Quote> {
      assertItems(items);
      const order = await load(folio);

      if (isTerminalStatus(order.status)) {
        throw new DomainError(
          "INVALID_TRANSITION",
          `La orden está en «${order.status}». Reábrela antes de cotizar.`,
        );
      }

      const now = clock.now();
      const pending = activePendingQuote(order, now);
      if (pending) {
        throw new DomainError(
          "INVALID_TRANSITION",
          "Ya hay una cotización pendiente. Edítala en vez de crear otra.",
        );
      }

      const expectedRev = order.rev;
      const from = order.status;
      const quote = buildQuote(order, items);
      order.quotes.push(quote);
      order.status = "Esperando aprobación";
      order.rev = expectedRev + 1;
      order.history.push({
        at: now.toISOString(),
        from,
        to: "Esperando aprobación",
        author: "dueño",
        note: `Cotización v${quote.version} creada`,
      });

      await persist(order, expectedRev);
      return structuredClone(quote);
    },

    /**
     * El cliente aprueba la cotización vigente. La evidencia se congela tal
     * como estaba la cotización en ese instante; ediciones posteriores solo
     * pueden crear una versión nueva y nunca tocar este registro.
     */
    async approveQuote(
      token: string,
      version: number,
      evidence: { ip: string; userAgent: string },
    ): Promise<{ approval: Approval; order: Order }> {
      if (!Number.isInteger(version) || version < 1) {
        throw new DomainError(
          "VALIDATION",
          "La versión de la cotización no es válida. Recarga la página.",
        );
      }

      const order = await store.getByToken(token);
      if (!order) {
        throw new DomainError("NOT_FOUND", "Enlace no válido.");
      }

      const now = clock.now();
      assertLinkAlive(order, now);

      if (isTerminalStatus(order.status)) {
        throw new DomainError(
          "INVALID_TRANSITION",
          `La orden está en «${order.status}» y ya no admite aprobaciones.`,
        );
      }

      const quote = order.quotes.find((entry) => entry.version === version);
      if (!quote) {
        throw new DomainError(
          "NOT_FOUND",
          "Esa cotización no existe. Recarga la página para ver la vigente.",
        );
      }

      switch (quote.status) {
        case "aprobada":
          throw new DomainError(
            "QUOTE_NOT_PENDING",
            "Esta cotización ya fue aprobada.",
          );
        case "rechazada":
          throw new DomainError(
            "QUOTE_NOT_PENDING",
            "Esta cotización fue rechazada.",
          );
        case "reemplazada":
          throw new DomainError(
            "QUOTE_NOT_PENDING",
            "La cotización cambió. Recarga la página para ver la versión vigente.",
          );
        case "vencida":
          throw new DomainError(
            "QUOTE_EXPIRED",
            "La cotización venció, pide una nueva al taller.",
          );
      }

      if (isExpired(quote, now)) {
        throw new DomainError(
          "QUOTE_EXPIRED",
          "La cotización venció, pide una nueva al taller.",
        );
      }

      const expectedRev = order.rev;
      const from = order.status;

      const approval: Approval = {
        id: `AP-${String(order.approvals.length + 1).padStart(4, "0")}`,
        quoteVersion: quote.version,
        items: structuredClone(quote.items),
        totalCents: quote.totalCents,
        phone: order.customer.phone,
        approvedAt: now.toISOString(),
        ip: cleanEvidence(evidence.ip, 100, "desconocida"),
        userAgent: cleanEvidence(evidence.userAgent, 400, "desconocido"),
      };

      quote.status = "aprobada";
      order.approvals.push(approval);

      if (from !== "En reparación") {
        order.status = "En reparación";
        order.history.push({
          at: now.toISOString(),
          from,
          to: "En reparación",
          author: "cliente",
          note: `Aprobación ${approval.id} · cotización v${quote.version}`,
        });
      }

      order.rev = expectedRev + 1;
      await persist(order, expectedRev);

      return {
        approval: structuredClone(approval),
        order: structuredClone(order),
      };
    },

    async editQuote(
      folio: string,
      version: number,
      items: LineItem[],
    ): Promise<Quote> {
      assertItems(items);
      const order = await load(folio);

      const current = order.quotes.find((quote) => quote.version === version);
      if (!current) {
        throw new DomainError("NOT_FOUND", "Esa cotización no existe.");
      }
      if (current.status !== "pendiente") {
        throw new DomainError(
          "QUOTE_NOT_PENDING",
          "Esta cotización ya no se puede editar.",
        );
      }
      if (isExpired(current, clock.now())) {
        throw new DomainError(
          "QUOTE_EXPIRED",
          "La cotización venció, pide una nueva.",
        );
      }

      const expectedRev = order.rev;
      current.status = "reemplazada";
      const next = buildQuote(order, items);
      order.quotes.push(next);
      order.rev = expectedRev + 1;

      await persist(order, expectedRev);
      return structuredClone(next);
    },

    /**
     * Siembra las órdenes de demostración si el almacén no tiene ninguna orden.
     * Devuelve true si se sembraron datos, false si ya había órdenes.
     */
    async seedIfEmpty(): Promise<boolean> {
      const existing = await store.list();
      if (existing.length > 0) {
        return false;
      }
      await seedDemo(workshop);
      return true;
    },

    /**
     * Borra todas las órdenes del almacén y vuelve a sembrar las de demostración.
     */
    async resetDemo(): Promise<void> {
      await store.clear();
      await seedDemo(workshop);
    },
  };

  return workshop;
}

export type Workshop = ReturnType<typeof createWorkshop>;
