import { randomBytes } from "node:crypto";

import { DomainError } from "./errors";
import { RevisionConflict, type Clock, type Store } from "./ports";
import type { LineItem, Order, OrderInput, Quote } from "./types";

const QUOTE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

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

    async findByFolio(folio: string): Promise<Order | null> {
      return store.getByFolio(folio);
    },

    async listOrders(): Promise<Order[]> {
      return store.list();
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
