import { randomBytes } from "node:crypto";

import { DomainError } from "./errors";
import { RevisionConflict, type Clock, type Store } from "./ports";
import {
  isOrderStatus,
  isTerminalStatus,
  type LineItem,
  type Order,
  type OrderInput,
  type OrderStatus,
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

const normalizeSearch = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const plateSearchKey = (value: string): string =>
  normalizeSearch(value).replace(/[^a-z0-9]/g, "");

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

  return {
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

      // `deliveredAt` se limpia al corregir la orden, así que una orden
      // terminal recupera la última entrega del historial para no dejar el
      // enlace vivo indefinidamente.
      const deliveredAt =
        order.deliveredAt ??
        (isTerminalStatus(order.status)
          ? ([...order.history]
              .reverse()
              .find((entry) => entry.to === "Entregado")?.at ?? null)
          : null);

      if (
        deliveredAt &&
        clock.now().getTime() >=
          new Date(deliveredAt).getTime() + PUBLIC_LINK_LIFETIME_MS
      ) {
        throw new DomainError(
          "LINK_EXPIRED",
          "El enlace venció. Pide al taller un enlace nuevo.",
        );
      }

      return {
        folio: order.folio,
        status: order.status,
        vehicle: order.vehicle,
        reportedIssue: order.reportedIssue,
        promisedAt: order.promisedAt,
        createdAt: order.createdAt,
        history: order.history.map(({ at, from, to }) => ({ at, from, to })),
      };
    },

    async findByFolio(folio: string): Promise<Order | null> {
      return store.getByFolio(folio);
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

      const now = clock.now();
      const pending = order.quotes.find(
        (quote) => quote.status === "pendiente" && !isExpired(quote, now),
      );
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
  };
}

export type Workshop = ReturnType<typeof createWorkshop>;
