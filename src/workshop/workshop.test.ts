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
    ).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
  });

  test("acepta una sola partida", async () => {
    const workshop = newWorkshop();
    const created = await workshop.createOrder(input);

    const quote = await workshop.createQuote(created.folio, [
      { concept: "Alineación", priceCents: 35050 },
    ]);

    expect(quote.items).toHaveLength(1);
    expect(quote.totalCents).toBe(35050);
  });

  test("no permite cotizar una orden terminal", async () => {
    const workshop = newWorkshop();
    const created = await workshop.createOrder(input);
    await workshop.changeStatus(created.folio, "Entregado");

    await expect(
      workshop.createQuote(created.folio, items),
    ).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
  });
});

describe("aprobación con evidencia", () => {
  const evidence = {
    ip: "189.203.10.5",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)",
  };

  const approvalWorkshop = () => {
    const clock = mutableClock("2026-11-02T18:00:00.000Z");
    const workshop = createWorkshop({
      store: new MemoryStore(),
      clock,
      ids: { token: () => "token-publico" },
    });
    return { workshop, clock };
  };

  test("congela partidas, total, teléfono y datos de la petición", async () => {
    const { workshop } = approvalWorkshop();
    const created = await workshop.createOrder(input);
    await workshop.createQuote(created.folio, items);

    const { approval } = await workshop.approveQuote(
      created.token,
      1,
      evidence,
    );

    expect(approval).toEqual({
      id: "AP-0001",
      quoteVersion: 1,
      items,
      totalCents: 165000,
      phone: input.customer.phone,
      approvedAt: "2026-11-02T18:00:00.000Z",
      ip: evidence.ip,
      userAgent: evidence.userAgent,
    });

    const reloaded = await workshop.findByFolio(created.folio);
    expect(reloaded?.status).toBe("En reparación");
    expect(reloaded?.quotes[0]?.status).toBe("aprobada");
    expect(reloaded?.approvals).toEqual([approval]);
    expect(reloaded?.history.at(-1)).toEqual({
      at: "2026-11-02T18:00:00.000Z",
      from: "Esperando aprobación",
      to: "En reparación",
      author: "cliente",
      note: "Aprobación AP-0001 · cotización v1",
    });
  });

  test("una cotización posterior no altera la evidencia ya registrada", async () => {
    const { workshop } = approvalWorkshop();
    const created = await workshop.createOrder(input);
    await workshop.createQuote(created.folio, items);
    const { approval } = await workshop.approveQuote(
      created.token,
      1,
      evidence,
    );

    await workshop.createQuote(created.folio, [
      { concept: "Cambio de bomba de agua", priceCents: 98000 },
    ]);
    await workshop.editQuote(created.folio, 2, [
      { concept: "Cambio de bomba de agua", priceCents: 105000 },
    ]);

    const reloaded = await workshop.findByFolio(created.folio);
    expect(reloaded?.approvals).toEqual([approval]);
    expect(reloaded?.approvals[0]?.items).toEqual(items);
    expect(reloaded?.approvals[0]?.totalCents).toBe(165000);
  });

  test("la proyección pública muestra el comprobante sin datos privados", async () => {
    const { workshop } = approvalWorkshop();
    const created = await workshop.createOrder(input);
    await workshop.createQuote(created.folio, items);
    await workshop.approveQuote(created.token, 1, evidence);

    const publicOrder = await workshop.publicOrderByToken(created.token);

    expect(publicOrder.approval).toEqual({
      id: "AP-0001",
      quoteVersion: 1,
      items,
      totalCents: 165000,
      approvedAt: "2026-11-02T18:00:00.000Z",
    });

    const serialized = JSON.stringify(publicOrder);
    expect(serialized).not.toContain(evidence.ip);
    expect(serialized).not.toContain(evidence.userAgent);
    expect(serialized).not.toContain(input.customer.phone);
  });

  test("una versión inexistente no crea evidencia", async () => {
    const { workshop } = approvalWorkshop();
    const created = await workshop.createOrder(input);
    await workshop.createQuote(created.folio, items);

    await expect(
      workshop.approveQuote(created.token, 7, evidence),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    const reloaded = await workshop.findByFolio(created.folio);
    expect(reloaded?.approvals).toHaveLength(0);
    expect(reloaded?.status).toBe("Esperando aprobación");
  });

  test("no permite aprobar dos veces la misma cotización", async () => {
    const { workshop } = approvalWorkshop();
    const created = await workshop.createOrder(input);
    await workshop.createQuote(created.folio, items);
    await workshop.approveQuote(created.token, 1, evidence);

    await expect(
      workshop.approveQuote(created.token, 1, evidence),
    ).rejects.toMatchObject({
      code: "QUOTE_NOT_PENDING",
      message: "Esta cotización ya fue aprobada.",
    });
  });

  test("no permite aprobar una cotización reemplazada", async () => {
    const { workshop } = approvalWorkshop();
    const created = await workshop.createOrder(input);
    await workshop.createQuote(created.folio, items);
    await workshop.editQuote(created.folio, 1, [
      { concept: "Alineación", priceCents: 35050 },
    ]);

    await expect(
      workshop.approveQuote(created.token, 1, evidence),
    ).rejects.toMatchObject({ code: "QUOTE_NOT_PENDING" });

    const reloaded = await workshop.findByFolio(created.folio);
    expect(reloaded?.approvals).toHaveLength(0);
  });

  test("no permite aprobar una cotización vencida", async () => {
    const { workshop, clock } = approvalWorkshop();
    const created = await workshop.createOrder(input);
    await workshop.createQuote(created.folio, items);

    clock.advance(7 * 24 * 60 * 60 * 1000);

    await expect(
      workshop.approveQuote(created.token, 1, evidence),
    ).rejects.toMatchObject({ code: "QUOTE_EXPIRED" });

    const reloaded = await workshop.findByFolio(created.folio);
    expect(reloaded?.approvals).toHaveLength(0);
  });

  test("no permite aprobar en una orden terminal", async () => {
    const { workshop } = approvalWorkshop();
    const created = await workshop.createOrder(input);
    await workshop.createQuote(created.folio, items);
    await workshop.changeStatus(created.folio, "Entregado");

    await expect(
      workshop.approveQuote(created.token, 1, evidence),
    ).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
  });

  test("cada aprobación recibe su propio folio", async () => {
    const { workshop } = approvalWorkshop();
    const created = await workshop.createOrder(input);
    await workshop.createQuote(created.folio, items);
    await workshop.approveQuote(created.token, 1, evidence);

    await workshop.createQuote(created.folio, [
      { concept: "Cambio de bomba de agua", priceCents: 98000 },
    ]);
    const second = await workshop.approveQuote(created.token, 2, evidence);

    expect(second.approval.id).toBe("AP-0002");
    expect(second.approval.quoteVersion).toBe(2);
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

describe("enlace público", () => {
  const publicWorkshop = () => {
    const clock = mutableClock("2026-11-02T18:00:00.000Z");
    const workshop = createWorkshop({
      store: new MemoryStore(),
      clock,
      ids: { token: () => "token-publico" },
    });
    return { workshop, clock };
  };

  test("expone solo los datos que el cliente puede ver", async () => {
    const { workshop } = publicWorkshop();
    const created = await workshop.createOrder({
      ...input,
      internalNotes: "No mostrar: el cliente regateó",
    });

    const publicOrder = await workshop.publicOrderByToken(created.token);

    expect(publicOrder).toMatchObject({
      folio: created.folio,
      status: "Recibido",
      vehicle: input.vehicle,
      reportedIssue: input.reportedIssue,
      createdAt: "2026-11-02T18:00:00.000Z",
    });
    expect(publicOrder.history).toEqual([
      {
        at: "2026-11-02T18:00:00.000Z",
        from: null,
        to: "Recibido",
      },
    ]);

    const serialized = JSON.stringify(publicOrder);
    expect(serialized).not.toContain("No mostrar");
    expect(publicOrder).not.toHaveProperty("internalNotes");
    expect(publicOrder).not.toHaveProperty("token");
    expect(publicOrder).not.toHaveProperty("customer");
    expect(publicOrder).not.toHaveProperty("rev");
  });

  test("una corrección que reabre la orden reactiva el enlace", async () => {
    const { workshop, clock } = publicWorkshop();
    const created = await workshop.createOrder(input);
    await workshop.changeStatus(created.folio, "Entregado");
    await workshop.changeStatus(created.folio, "En reparación", "Regresó", {
      correction: true,
    });

    clock.advance(31 * 24 * 60 * 60 * 1000);

    await expect(
      workshop.publicOrderByToken(created.token),
    ).resolves.toMatchObject({ status: "En reparación" });
  });

  test("cancelar una orden entregada no deja el enlace vivo para siempre", async () => {
    const { workshop, clock } = publicWorkshop();
    const created = await workshop.createOrder(input);
    await workshop.changeStatus(created.folio, "Entregado");
    await workshop.changeStatus(created.folio, "Cancelado", "Se canceló", {
      correction: true,
    });

    clock.advance(30 * 24 * 60 * 60 * 1000);

    await expect(
      workshop.publicOrderByToken(created.token),
    ).rejects.toMatchObject({ code: "LINK_EXPIRED" });
  });

  test("incluye la cotización pendiente con partidas y total", async () => {
    const { workshop } = publicWorkshop();
    const created = await workshop.createOrder(input);
    await workshop.createQuote(created.folio, items);

    const publicOrder = await workshop.publicOrderByToken(created.token);

    expect(publicOrder.quote).toEqual({
      version: 1,
      items,
      totalCents: 165000,
      createdAt: "2026-11-02T18:00:00.000Z",
      expiresAt: "2026-11-09T18:00:00.000Z",
    });
  });

  test("la vista pública solo muestra la cotización vigente", async () => {
    const { workshop } = publicWorkshop();
    const created = await workshop.createOrder(input);
    await workshop.createQuote(created.folio, items);

    await workshop.editQuote(created.folio, 1, [
      { concept: "Alineación", priceCents: 35050 },
    ]);

    const publicOrder = await workshop.publicOrderByToken(created.token);

    expect(publicOrder.quote).toMatchObject({
      version: 2,
      items: [{ concept: "Alineación", priceCents: 35050 }],
      totalCents: 35050,
    });
  });

  test("una cotización vencida deja de ser la vigente", async () => {
    const clock = mutableClock("2026-11-02T18:00:00.000Z");
    const workshop = createWorkshop({
      store: new MemoryStore(),
      clock,
      ids: { token: () => "token-publico" },
    });
    const created = await workshop.createOrder(input);
    await workshop.createQuote(created.folio, items);

    clock.advance(8 * 24 * 60 * 60 * 1000);

    expect(await workshop.findActiveQuote(created.folio)).toBeNull();
    expect((await workshop.publicOrderByToken(created.token)).quote).toBeNull();

    await workshop.createQuote(created.folio, [
      { concept: "Alineación", priceCents: 35050 },
    ]);

    expect((await workshop.findActiveQuote(created.folio))?.version).toBe(2);
    expect((await workshop.publicOrderByToken(created.token)).quote).toMatchObject({
      version: 2,
      totalCents: 35050,
    });
  });

  test("no mezcla datos de otra orden", async () => {
    let nextToken = 0;
    const workshop = createWorkshop({
      store: new MemoryStore(),
      clock: mutableClock("2026-11-02T18:00:00.000Z"),
      ids: { token: () => `token-${++nextToken}` },
    });
    const first = await workshop.createOrder({
      ...input,
      internalNotes: "No mostrar: el cliente regateó",
    });
    await workshop.createOrder({
      ...input,
      customer: { name: "Otra Persona", phone: "5599999999" },
      vehicle: { plate: "OTRA-999", make: "Toyota", model: "Corolla" },
      reportedIssue: "Falla de la otra orden",
    });

    const publicOrder = await workshop.publicOrderByToken(first.token);
    const serialized = JSON.stringify(publicOrder);

    expect(publicOrder.folio).toBe(first.folio);
    expect(serialized).not.toContain("Otra Persona");
    expect(serialized).not.toContain("OTRA-999");
    expect(serialized).not.toContain("Falla de la otra orden");
  });

  test("un token desconocido no revela si la orden existe", async () => {
    const { workshop } = publicWorkshop();
    await workshop.createOrder(input);

    await expect(
      workshop.publicOrderByToken("token-que-no-existe"),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Enlace no válido.",
    });
  });

  test("vence 30 días después de entregada, no antes", async () => {
    const { workshop, clock } = publicWorkshop();
    const created = await workshop.createOrder(input);
    await workshop.changeStatus(created.folio, "Entregado");

    clock.advance(30 * 24 * 60 * 60 * 1000 - 1);
    await expect(
      workshop.publicOrderByToken(created.token),
    ).resolves.toMatchObject({ status: "Entregado" });

    clock.advance(1);
    await expect(
      workshop.publicOrderByToken(created.token),
    ).rejects.toMatchObject({ code: "LINK_EXPIRED" });
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
