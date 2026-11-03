import { describe, expect, test } from "vitest";

import { MemoryStore } from "../store/memory-store";
import { DEMO_SEEDS } from "./demo-seed";
import { createWorkshop } from "./workshop";

const fixedClock = (iso: string) => ({ now: () => new Date(iso) });

describe("datos de demostración (demo-seed)", () => {
  test("seedIfEmpty siembra exactamente las 5 órdenes con el almacén vacío", async () => {
    const store = new MemoryStore();
    const workshop = createWorkshop({
      store,
      clock: fixedClock("2026-11-02T18:00:00.000Z"),
    });

    const seeded = await workshop.seedIfEmpty();
    expect(seeded).toBe(true);

    const orders = await workshop.listOrders();
    expect(orders).toHaveLength(5);
    expect(orders.map((o) => o.folio)).toEqual([
      "RM-0001",
      "RM-0002",
      "RM-0003",
      "RM-0004",
      "RM-0005",
    ]);

    // Verifica estados clave sembrados
    const byStatus = Object.fromEntries(orders.map((o) => [o.status, o]));

    expect(byStatus["Esperando aprobación"]).toBeDefined();
    expect(byStatus["Esperando aprobación"].quotes).toHaveLength(1);
    expect(byStatus["Esperando aprobación"].quotes[0].status).toBe("pendiente");

    expect(byStatus["En reparación"]).toBeDefined();
    expect(byStatus["En reparación"].approvals).toHaveLength(1);
    expect(byStatus["En reparación"].approvals[0].id).toBe("AP-0001");
    expect(byStatus["En reparación"].quotes[0].status).toBe("aprobada");

    expect(byStatus["Listo para entrega"]).toBeDefined();
    expect(byStatus["Entregado"]).toBeDefined();
    expect(byStatus["Entregado"].deliveredAt).toBeTruthy();
    expect(byStatus["En diagnóstico"]).toBeDefined();
  });

  test("seedIfEmpty no sobreescribe ni duplica datos si ya existen órdenes", async () => {
    const store = new MemoryStore();
    const workshop = createWorkshop({
      store,
      clock: fixedClock("2026-11-02T18:00:00.000Z"),
    });

    await workshop.createOrder({
      customer: { name: "Cliente Preexistente", phone: "55 0000 0000" },
      vehicle: { plate: "PRE-001", make: "VW", model: "Sedán" },
      reportedIssue: "Falla previa",
    });

    const seeded = await workshop.seedIfEmpty();
    expect(seeded).toBe(false);

    const orders = await workshop.listOrders();
    expect(orders).toHaveLength(1);
    expect(orders[0].customer.name).toBe("Cliente Preexistente");
  });

  test("resetDemo limpia las órdenes y vuelve a sembrar el conjunto de demo", async () => {
    const store = new MemoryStore();
    const workshop = createWorkshop({
      store,
      clock: fixedClock("2026-11-02T18:00:00.000Z"),
    });

    // Se agregan datos arbitrarios
    await workshop.createOrder({
      customer: { name: "Cliente Descartable", phone: "55 9999 8888" },
      vehicle: { plate: "DEL-999", make: "Ford", model: "Fiesta" },
      reportedIssue: "Descartar",
    });

    expect(await workshop.listOrders()).toHaveLength(1);

    await workshop.resetDemo();

    const orders = await workshop.listOrders();
    expect(orders).toHaveLength(5);
    expect(orders.map((o) => o.folio)).toEqual([
      "RM-0001",
      "RM-0002",
      "RM-0003",
      "RM-0004",
      "RM-0005",
    ]);
  });
});
