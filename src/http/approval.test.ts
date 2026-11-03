import { beforeEach, describe, expect, test } from "vitest";

import { POST as login } from "@/app/api/login/route";
import { POST as createOrder } from "@/app/api/orders/route";
import { POST as createQuote } from "@/app/api/orders/[folio]/quotes/route";
import { POST as approve } from "@/app/api/public/orders/[token]/approve/route";
import { GET as publicOrder } from "@/app/api/public/orders/[token]/route";
import { getWorkshop, resetWorkshop } from "@/service";

const PASSWORD = "contraseña-de-prueba";

type Options = {
  accept?: string;
  cookie?: string;
  headers?: Record<string, string>;
};

const request = (
  url: string,
  body: URLSearchParams,
  options: Options = {},
) =>
  new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      ...(options.accept ? { accept: options.accept } : {}),
      ...(options.cookie ? { cookie: options.cookie } : {}),
      ...options.headers,
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

const quoteForm = () => {
  const body = new URLSearchParams();
  body.append("concept", "Cambio de balatas");
  body.append("price", "1,200.00");
  body.append("concept", "Rectificado de discos");
  body.append("price", "450.50");
  return body;
};

const folioContext = (folio: string) => ({ params: Promise.resolve({ folio }) });
const tokenContext = (token: string) => ({ params: Promise.resolve({ token }) });

async function sessionCookie(): Promise<string> {
  const response = await login(
    request(
      "http://localhost/api/login",
      new URLSearchParams({ password: PASSWORD }),
    ),
  );
  const header = response.headers.get("set-cookie");
  if (!header) throw new Error("El login no emitió cookie");
  return header.split(";")[0]!;
}

async function scenario(): Promise<{ folio: string; token: string }> {
  const cookie = await sessionCookie();
  const created = await createOrder(
    request("http://localhost/api/orders", orderForm(), {
      accept: "application/json",
      cookie,
    }),
  );
  const { folio, token } = (await created.json()).order;

  const quoted = await createQuote(
    request(`http://localhost/api/orders/${folio}/quotes`, quoteForm(), {
      accept: "application/json",
      cookie,
    }),
    folioContext(folio),
  );
  expect(quoted.status).toBe(201);

  return { folio, token };
}

const approveWith = (
  token: string,
  version: string | number,
  options: Options = {},
) => {
  const body = new URLSearchParams();
  body.append("version", String(version));
  return approve(
    request(
      `http://localhost/api/public/orders/${token}/approve`,
      body,
      options,
    ),
    tokenContext(token),
  );
};

const lookup = (token: string) =>
  publicOrder(
    new Request(`http://localhost/api/public/orders/${token}`),
    tokenContext(token),
  );

beforeEach(() => {
  process.env.OWNER_PASSWORD = PASSWORD;
  process.env.SESSION_SECRET = "secreto-de-prueba-suficientemente-largo";
  resetWorkshop();
});

describe("contrato de aprobación pública", () => {
  test("aprueba desde el enlace y redirige con el aviso", async () => {
    const { token } = await scenario();

    const response = await approveWith(token, 1, {
      headers: {
        "x-forwarded-for": "189.203.10.5, 10.0.0.1",
        "user-agent": "Mozilla/5.0 (iPhone)",
      },
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      `/orden/${token}?aprobada=1`,
    );

    const body = await (await lookup(token)).json();
    expect(body.order.status).toBe("En reparación");
    expect(body.order.quote).toBeNull();
    expect(body.order.approval).toMatchObject({
      id: "AP-0001",
      quoteVersion: 1,
      totalCents: 165050,
      approvedAt: expect.any(String),
      items: [
        { concept: "Cambio de balatas", priceCents: 120000 },
        { concept: "Rectificado de discos", priceCents: 45050 },
      ],
    });

    const serialized = JSON.stringify(body.order);
    expect(serialized).not.toContain("189.203.10.5");
    expect(serialized).not.toContain("Mozilla/5.0");
    expect(serialized).not.toContain("55 1234 5678");
  });

  test("el dueño recibe IP, agente de usuario y teléfono como evidencia", async () => {
    const { folio, token } = await scenario();

    await approveWith(token, 1, {
      headers: {
        "x-forwarded-for": "189.203.10.5, 10.0.0.1",
        "user-agent": "Mozilla/5.0 (iPhone)",
      },
    });

    const order = await getWorkshop().findByFolio(folio);
    expect(order?.approvals[0]).toMatchObject({
      phone: "55 1234 5678",
      ip: "189.203.10.5",
      userAgent: "Mozilla/5.0 (iPhone)",
    });
  });

  test("acepta JSON y devuelve el comprobante público", async () => {
    const { token } = await scenario();

    const response = await approveWith(token, 1, {
      accept: "application/json",
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.approval).toMatchObject({
      id: "AP-0001",
      quoteVersion: 1,
      totalCents: 165050,
    });
    expect(body.approval).not.toHaveProperty("ip");
    expect(body.approval).not.toHaveProperty("userAgent");
    expect(body.approval).not.toHaveProperty("phone");
  });

  test("una segunda aprobación responde 409 y no duplica evidencia", async () => {
    const { folio, token } = await scenario();
    await approveWith(token, 1, { accept: "application/json" });

    const response = await approveWith(token, 1, {
      accept: "application/json",
    });

    expect(response.status).toBe(409);
    expect((await response.json()).error).toContain("ya fue aprobada");

    const order = await getWorkshop().findByFolio(folio);
    expect(order?.approvals).toHaveLength(1);
  });

  test("una versión desconocida responde 404 y no crea evidencia", async () => {
    const { folio, token } = await scenario();

    const response = await approveWith(token, 9, {
      accept: "application/json",
    });

    expect(response.status).toBe(404);
    const order = await getWorkshop().findByFolio(folio);
    expect(order?.approvals).toHaveLength(0);
    expect(order?.status).toBe("Esperando aprobación");
  });

  test("sin versión válida responde 422", async () => {
    const { token } = await scenario();

    const response = await approveWith(token, "", {
      accept: "application/json",
    });

    expect(response.status).toBe(422);
    expect((await response.json()).error).toContain("Recarga");
  });

  test("un token desconocido responde 404", async () => {
    const response = await approveWith("token-que-no-existe", 1, {
      accept: "application/json",
    });

    expect(response.status).toBe(404);
    expect((await response.json()).error).toBe("Enlace no válido.");
  });

  test("el formulario devuelve el error a la página del cliente", async () => {
    const { token } = await scenario();

    const response = await approveWith(token, 9);

    expect(response.status).toBe(303);
    const location = response.headers.get("location") ?? "";
    expect(location.startsWith(`/orden/${token}?error=`)).toBe(true);
    expect(decodeURIComponent(location)).toContain("no existe");
  });
});
