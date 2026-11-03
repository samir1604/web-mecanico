import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { POST as login } from "@/app/api/login/route";
import { GET as publicOrder } from "@/app/api/public/orders/[token]/route";
import { POST as createOrder } from "@/app/api/orders/route";
import { POST as changeStatus } from "@/app/api/orders/[folio]/status/route";
import { resetWorkshop } from "@/service";

const PASSWORD = "contraseña-de-prueba";

const request = (
  url: string,
  data: Record<string, string>,
  options: { accept?: string; cookie?: string } = {},
) =>
  new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      ...(options.accept ? { accept: options.accept } : {}),
      ...(options.cookie ? { cookie: options.cookie } : {}),
    },
    body: new URLSearchParams(data),
  });

const orderForm = {
  name: "Juan Pérez",
  phone: "55 1234 5678",
  plate: "abc-123",
  make: "Nissan",
  model: "Versa 2018",
  reportedIssue: "Ruido en la suspensión delantera",
  internalNotes: "No mostrar: el cliente regateó",
};

async function sessionCookie(): Promise<string> {
  const response = await login(
    request("http://localhost/api/login", { password: PASSWORD }),
  );
  const header = response.headers.get("set-cookie");
  if (!header) throw new Error("El login no emitió cookie");
  return header.split(";")[0]!;
}

async function create(cookie: string): Promise<{ folio: string; token: string }> {
  const response = await createOrder(
    request("http://localhost/api/orders", orderForm, {
      accept: "application/json",
      cookie,
    }),
  );
  const body = await response.json();
  return { folio: body.order.folio, token: body.order.token };
}

const lookup = (token: string) =>
  publicOrder(new Request(`http://localhost/api/public/orders/${token}`), {
    params: Promise.resolve({ token }),
  });

beforeEach(() => {
  process.env.OWNER_PASSWORD = PASSWORD;
  process.env.SESSION_SECRET = "secreto-de-prueba-suficientemente-largo";
  resetWorkshop();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("contrato del enlace público", () => {
  test("un token válido devuelve solo datos públicos", async () => {
    const cookie = await sessionCookie();
    const { token, folio } = await create(cookie);

    const response = await lookup(token);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.order).toMatchObject({
      folio,
      status: "Recibido",
      reportedIssue: "Ruido en la suspensión delantera",
      vehicle: { plate: "ABC-123", make: "Nissan", model: "Versa 2018" },
    });
    expect(body.order.history).toHaveLength(1);

    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain("regateó");
    expect(body.order).not.toHaveProperty("internalNotes");
    expect(body.order).not.toHaveProperty("token");
    expect(body.order).not.toHaveProperty("customer");
  });

  test("un token desconocido responde 404 sin revelar datos", async () => {
    const response = await lookup("token-que-no-existe");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Enlace no válido." });
  });

  test("un token con formato inválido responde 404", async () => {
    const response = await lookup("%");

    expect(response.status).toBe(404);
    expect((await response.json()).error).toBe("Enlace no válido.");
  });

  test("a los 30 días de entregada responde enlace vencido", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));

    const cookie = await sessionCookie();
    const { folio, token } = await create(cookie);

    const delivered = await changeStatus(
      request(
        `http://localhost/api/orders/${folio}/status`,
        { status: "Entregado" },
        { accept: "application/json", cookie },
      ),
      { params: Promise.resolve({ folio }) },
    );
    expect(delivered.status).toBe(200);

    vi.setSystemTime(new Date("2026-01-31T11:59:59.999Z"));
    expect((await lookup(token)).status).toBe(200);

    vi.setSystemTime(new Date("2026-01-31T12:00:00.000Z"));
    const expired = await lookup(token);

    expect(expired.status).toBe(410);
    expect((await expired.json()).error).toContain("venció");
  });
});
