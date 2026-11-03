import { beforeEach, describe, expect, test } from "vitest";

import { POST as login } from "@/app/api/login/route";
import { POST as createOrder } from "@/app/api/orders/route";
import { GET as publicOrder } from "@/app/api/public/orders/[token]/route";
import { POST as createQuote } from "@/app/api/orders/[folio]/quotes/route";
import { resetWorkshop } from "@/service";

const PASSWORD = "contraseña-de-prueba";

const request = (
  url: string,
  body: URLSearchParams,
  options: { accept?: string; cookie?: string } = {},
) =>
  new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      ...(options.accept ? { accept: options.accept } : {}),
      ...(options.cookie ? { cookie: options.cookie } : {}),
    },
    body,
  });

const orderForm = () =>
  new URLSearchParams({
    name: "Juan Pérez",
    phone: "55 1234 5678",
    plate: "abc-123",
    make: "Nissan",
    model: "Versa 2018",
    reportedIssue: "Ruido en la suspensión delantera",
  });

const quoteForm = (rows: Array<[string, string]>) => {
  const body = new URLSearchParams();
  for (const [concept, price] of rows) {
    body.append("concept", concept);
    body.append("price", price);
  }
  return body;
};

const context = (folio: string) => ({ params: Promise.resolve({ folio }) });

async function sessionCookie(): Promise<string> {
  const response = await login(
    request("http://localhost/api/login", new URLSearchParams({ password: PASSWORD })),
  );
  const header = response.headers.get("set-cookie");
  if (!header) throw new Error("El login no emitió cookie");
  return header.split(";")[0]!;
}

async function create(cookie: string): Promise<{ folio: string; token: string }> {
  const response = await createOrder(
    request("http://localhost/api/orders", orderForm(), {
      accept: "application/json",
      cookie,
    }),
  );
  const body = await response.json();
  return { folio: body.order.folio, token: body.order.token };
}

const quote = (
  folio: string,
  body: URLSearchParams,
  options: { accept?: string; cookie?: string } = {},
) =>
  createQuote(
    request(`http://localhost/api/orders/${folio}/quotes`, body, options),
    context(folio),
  );

beforeEach(() => {
  process.env.OWNER_PASSWORD = PASSWORD;
  process.env.SESSION_SECRET = "secreto-de-prueba-suficientemente-largo";
  resetWorkshop();
});

describe("contrato de cotización", () => {
  test("sin sesión no se puede cotizar", async () => {
    const response = await quote("RM-0001", quoteForm([["Balatas", "100"]]), {
      accept: "application/json",
    });

    expect(response.status).toBe(401);
  });

  test("crea la cotización, calcula el total y mueve la orden", async () => {
    const cookie = await sessionCookie();
    const { folio, token } = await create(cookie);

    const response = await quote(
      folio,
      quoteForm([
        ["Cambio de balatas", "1,200.00"],
        ["Rectificado de discos", "450.50"],
      ]),
      { accept: "application/json", cookie },
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.quote).toMatchObject({
      version: 1,
      status: "pendiente",
      totalCents: 165050,
      items: [
        { concept: "Cambio de balatas", priceCents: 120000 },
        { concept: "Rectificado de discos", priceCents: 45050 },
      ],
    });

    const publicResponse = await publicOrder(
      new Request(`http://localhost/api/public/orders/${token}`),
      { params: Promise.resolve({ token }) },
    );
    const publicBody = await publicResponse.json();

    expect(publicBody.order.status).toBe("Esperando aprobación");
    expect(publicBody.order.quote).toMatchObject({
      version: 1,
      totalCents: 165050,
    });
  });

  test("un precio inválido responde 422 y no toca la orden", async () => {
    const cookie = await sessionCookie();
    const { folio, token } = await create(cookie);

    const response = await quote(
      folio,
      quoteForm([["Balatas", "mil pesos"]]),
      { accept: "application/json", cookie },
    );

    expect(response.status).toBe(422);
    expect((await response.json()).error).toContain("precio");

    const publicResponse = await publicOrder(
      new Request(`http://localhost/api/public/orders/${token}`),
      { params: Promise.resolve({ token }) },
    );
    expect((await publicResponse.json()).order.quote).toBeNull();
  });

  test("no permite una segunda cotización pendiente", async () => {
    const cookie = await sessionCookie();
    const { folio } = await create(cookie);
    await quote(folio, quoteForm([["Balatas", "100"]]), {
      accept: "application/json",
      cookie,
    });

    const response = await quote(
      folio,
      quoteForm([["Otra cosa", "200"]]),
      { accept: "application/json", cookie },
    );

    expect(response.status).toBe(409);
    expect((await response.json()).error).toContain("pendiente");
  });

  test("el formulario redirige al detalle con el aviso", async () => {
    const cookie = await sessionCookie();
    const { folio } = await create(cookie);

    const response = await quote(folio, quoteForm([["Balatas", "100"]]), {
      cookie,
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      `/ordenes/${folio}?cotizacion=1`,
    );
  });
});
