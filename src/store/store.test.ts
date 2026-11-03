import { describe, expect, test } from "vitest";

import { DomainError } from "@/workshop/errors";
import { RevisionConflict, type Store } from "@/workshop/ports";
import type { Order } from "@/workshop/types";
import { createWorkshop } from "@/workshop/workshop";
import { MemoryStore } from "./memory-store";

const clock = { now: () => new Date("2026-11-02T18:00:00.000Z") };

const input = {
  customer: { name: "Juan Pérez", phone: "55 1234 5678" },
  vehicle: { plate: "ABC-123", make: "Nissan", model: "Versa 2018" },
  reportedIssue: "Ruido en la suspensión",
};

const items = [{ concept: "Balatas", priceCents: 120000 }];

describe("control de revisión", () => {
  test("el store rechaza guardar sobre una revisión vieja", async () => {
    const store = new MemoryStore();
    const workshop = createWorkshop({
      store,
      clock,
      ids: { token: () => "token-1" },
    });
    const order = await workshop.createOrder(input);

    const first = (await store.getByFolio(order.folio)) as Order;
    const second = (await store.getByFolio(order.folio)) as Order;

    first.rev = 2;
    await store.save(first, 1);

    await expect(store.save(second, 1)).rejects.toBeInstanceOf(
      RevisionConflict,
    );
  });

  test("el store no deja crear dos órdenes con el mismo folio", async () => {
    const store = new MemoryStore();
    const workshop = createWorkshop({
      store,
      clock,
      ids: { token: () => "token-1" },
    });
    const order = await workshop.createOrder(input);

    await expect(store.create(order)).rejects.toBeInstanceOf(RevisionConflict);
  });

  test("el dominio traduce el conflicto a VERSION_CONFLICT", async () => {
    const base = new MemoryStore();
    let snapshot: Order | null = null;
    let reads = 0;

    // Simula otra sesión que guardó entre la lectura y la escritura.
    const staleStore: Store = {
      nextFolio: () => base.nextFolio(),
      create: (order) => base.create(order),
      save: (order, expectedRev) => base.save(order, expectedRev),
      getByToken: (token) => base.getByToken(token),
      list: () => base.list(),
      getByFolio: async (folio) => {
        reads += 1;
        if (reads === 1) {
          snapshot = await base.getByFolio(folio);
          return snapshot ? structuredClone(snapshot) : null;
        }
        return snapshot ? structuredClone(snapshot) : base.getByFolio(folio);
      },
    };

    const workshop = createWorkshop({
      store: staleStore,
      clock,
      ids: { token: () => "token-1" },
    });
    const order = await workshop.createOrder(input);

    await workshop.createQuote(order.folio, items);

    const second = workshop.createQuote(order.folio, items);
    await expect(second).rejects.toBeInstanceOf(DomainError);
    await expect(second).rejects.toMatchObject({ code: "VERSION_CONFLICT" });

    const saved = await base.getByFolio(order.folio);
    expect(saved?.quotes).toHaveLength(1);
  });
});
