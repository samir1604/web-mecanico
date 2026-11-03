import { describe, expect, test } from "vitest";

import { MemoryStore } from "../store/memory-store";
import { DomainError } from "./errors";
import { createWorkshop } from "./workshop";

const fixedClock = (iso: string) => ({ now: () => new Date(iso) });

const mutableClock = (iso: string) => {
  let current = new Date(iso);
  return {
    now: () => new Date(current),
    advance(ms: number) {
      current = new Date(current.getTime() + ms);
    },
  };
};

const newWorkshop = (token = "token-de-prueba") =>
  createWorkshop({
    store: new MemoryStore(),
    clock: fixedClock("2026-11-02T18:00:00.000Z"),
    ids: { token: () => token },
  });

const input = {
  customer: { name: "Juan Pérez", phone: "+525512345678" },
  vehicle: { plate: "ABC-123", make: "Nissan", model: "Versa 2018" },
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

describe("cotizaciones", () => {  test("crear mueve a Esperando aprobación y calcula el total", async () => {
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

describe("cambios de estado", () => {
  const statusWorkshop = () => {
    const clock = mutableClock("2026-11-02T18:00:00.000Z");
    const workshop = createWorkshop({
      store: new MemoryStore(),
      clock,
      ids: { token: () => "token-de-prueba" },
    });
    return { workshop, clock };
  };

  test("registra autor, fecha y nota, y mueve la orden", async () => {
    const { workshop, clock } = statusWorkshop();
    const created = await workshop.createOrder(input);

    clock.advance(60_000);
    const updated = await workshop.changeStatus(
      created.folio,
      "En diagnóstico",
      "Revisión inicial en el elevador",
    );

    expect(updated.status).toBe("En diagnóstico");

    const reloaded = await workshop.findByFolio(created.folio);
    expect(reloaded?.status).toBe("En diagnóstico");
    expect(reloaded?.history).toHaveLength(2);
    expect(reloaded?.history.at(-1)).toEqual({
      at: "2026-11-02T18:01:00.000Z",
      from: "Recibido",
      to: "En diagnóstico",
      author: "dueño",
      note: "Revisión inicial en el elevador",
    });
  });

  test("rechaza un estado desconocido o el mismo estado actual", async () => {
    const { workshop } = statusWorkshop();
    const created = await workshop.createOrder(input);

    await expect(
      workshop.changeStatus(created.folio, "Pendiente" as never),
    ).rejects.toMatchObject({ code: "VALIDATION" });

    await expect(
      workshop.changeStatus(created.folio, "Recibido"),
    ).rejects.toMatchObject({ code: "VALIDATION" });

    const reloaded = await workshop.findByFolio(created.folio);
    expect(reloaded?.history).toHaveLength(1);
  });

  test("Entregado es terminal salvo corrección manual explícita", async () => {
    const { workshop } = statusWorkshop();
    const created = await workshop.createOrder(input);

    const delivered = await workshop.changeStatus(created.folio, "Entregado");
    expect(delivered.status).toBe("Entregado");
    expect(delivered.deliveredAt).not.toBeNull();

    await expect(
      workshop.changeStatus(created.folio, "En reparación"),
    ).rejects.toMatchObject({ code: "INVALID_TRANSITION" });

    const corrected = await workshop.changeStatus(
      created.folio,
      "En reparación",
      "El cliente regresó el auto",
      { correction: true },
    );

    expect(corrected.status).toBe("En reparación");
    expect(corrected.deliveredAt).toBeNull();
    expect(corrected.history.at(-1)).toMatchObject({
      from: "Entregado",
      to: "En reparación",
      note: "El cliente regresó el auto",
    });
  });

  test("cancelar conserva el historial y deja la orden terminal", async () => {
    const { workshop } = statusWorkshop();
    const created = await workshop.createOrder(input);
    await workshop.changeStatus(created.folio, "En diagnóstico");

    const cancelled = await workshop.changeStatus(
      created.folio,
      "Cancelado",
      "El cliente decidió no repararlo",
    );

    expect(cancelled.status).toBe("Cancelado");
    expect(cancelled.history).toHaveLength(3);
    expect(cancelled.history.at(-1)).toMatchObject({
      from: "En diagnóstico",
      to: "Cancelado",
      author: "dueño",
      note: "El cliente decidió no repararlo",
    });

    await expect(
      workshop.changeStatus(created.folio, "Recibido"),
    ).rejects.toMatchObject({ code: "INVALID_TRANSITION" });

    const reopened = await workshop.changeStatus(
      created.folio,
      "Recibido",
      "Corrección: la orden no debía cancelarse",
      { correction: true },
    );
    expect(reopened.status).toBe("Recibido");
    expect(reopened.history.at(-1)).toMatchObject({
      from: "Cancelado",
      to: "Recibido",
      note: "Corrección: la orden no debía cancelarse",
    });
  });
});

describe("búsqueda del tablero", () => {
  test("filtra por placa o nombre sin distinguir acentos ni guiones", async () => {
    const workshop = newWorkshop();
    await workshop.createOrder(input);
    await workshop.createOrder({
      ...input,
      customer: { name: "María López", phone: "55 8765 4321" },
      vehicle: { plate: "xyz-987", make: "Toyota", model: "Yaris" },
    });

    expect(await workshop.searchOrders("  ")).toHaveLength(2);
    expect((await workshop.searchOrders("perez")).map((o) => o.folio)).toEqual([
      "RM-0001",
    ]);
    expect((await workshop.searchOrders("MARIA")).map((o) => o.folio)).toEqual([
      "RM-0002",
    ]);
    expect((await workshop.searchOrders("abc123")).map((o) => o.folio)).toEqual([
      "RM-0001",
    ]);
    expect(await workshop.searchOrders("Nissan Versa 2018")).toEqual([]);
  });
});
