import { describe, expect, test } from "vitest";

import { MemoryStore } from "../store/memory-store";
import { DomainError } from "./errors";
import { createWorkshop } from "./workshop";

const fixedClock = (iso: string) => ({ now: () => new Date(iso) });

const newWorkshop = (token = "token-de-prueba") =>
  createWorkshop({
    store: new MemoryStore(),
    clock: fixedClock("2026-11-02T18:00:00.000Z"),
    ids: { token: () => token },
  });

const input = {
  customer: { name: "Juan Pérez", phone: "+525512345678" },
  vehicle: { plate: "ABC-123", model: "Nissan Versa 2018" },
  reportedIssue: "Ruido en la suspensión delantera",
};

const items = [
  { concept: "Cambio de balatas delanteras", priceCents: 120000 },
  { concept: "Rectificado de discos", priceCents: 45000 },
];

describe("crear orden", () => {
  test("asigna un folio legible y nace en Recibido", async () => {
    const order = await newWorkshop().createOrder(input);

    expect(order.folio).toBe("RM-0001");
    expect(order.status).toBe("Recibido");
    expect(order.createdAt).toBe("2026-11-02T18:00:00.000Z");
    expect(order.history).toHaveLength(1);
    expect(order.quotes).toHaveLength(0);
  });

  test("genera un token largo, distinto del folio", async () => {
    const order = await createWorkshop({
      store: new MemoryStore(),
      clock: fixedClock("2026-11-02T18:00:00.000Z"),
    }).createOrder(input);

    expect(order.token).toHaveLength(43);
    expect(order.token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(order.token).not.toBe(order.folio);
  });

  test("el token resuelve la orden y el folio no", async () => {
    const workshop = newWorkshop("token-resoluble");
    const created = await workshop.createOrder(input);

    expect(await workshop.findByToken("token-resoluble")).toEqual(created);
    expect(await workshop.findByToken(created.folio)).toBeNull();
  });
});

describe("cotizaciones", () => {
  test("crear mueve a Esperando aprobación y calcula el total", async () => {
    const workshop = newWorkshop();
    const created = await workshop.createOrder(input);

    const quote = await workshop.createQuote(created.folio, items);

    expect(quote.version).toBe(1);
    expect(quote.status).toBe("pendiente");
    expect(quote.totalCents).toBe(165000);
    expect(quote.expiresAt).toBe("2026-11-09T18:00:00.000Z");

    const reloaded = await workshop.findByFolio(created.folio);
    expect(reloaded?.status).toBe("Esperando aprobación");
    expect(reloaded?.quotes).toHaveLength(1);
    expect(reloaded?.history.at(-1)?.to).toBe("Esperando aprobación");
  });

  test("editar una pendiente crea v2 y reemplaza la v1", async () => {
    const workshop = newWorkshop();
    const created = await workshop.createOrder(input);
    await workshop.createQuote(created.folio, items);

    const edited = await workshop.editQuote(created.folio, 1, [
      { concept: "Cambio de balatas delanteras", priceCents: 110000 },
    ]);

    expect(edited.version).toBe(2);
    expect(edited.totalCents).toBe(110000);

    const reloaded = await workshop.findByFolio(created.folio);
    expect(reloaded?.quotes[0]?.status).toBe("reemplazada");
    expect(reloaded?.quotes[1]?.status).toBe("pendiente");
  });

  test("no permite dos cotizaciones pendientes a la vez", async () => {
    const workshop = newWorkshop();
    const created = await workshop.createOrder(input);
    await workshop.createQuote(created.folio, items);

    await expect(
      workshop.createQuote(created.folio, items),
    ).rejects.toBeInstanceOf(DomainError);
  });
});
