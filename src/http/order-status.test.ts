import { beforeEach, describe, expect, test } from "vitest";

import { POST as login } from "@/app/api/login/route";
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
};

const context = (folio: string) => ({ params: Promise.resolve({ folio }) });

async function sessionCookie(): Promise<string> {
  const response = await login(
    request("http://localhost/api/login", { password: PASSWORD }),
  );
  const header = response.headers.get("set-cookie");
  if (!header) throw new Error("El login no emitió cookie");
  return header.split(";")[0]!;
}

async function create(cookie: string, data = orderForm): Promise<string> {
  const response = await createOrder(
    request("http://localhost/api/orders", data, {
      accept: "application/json",
      cookie,
    }),
  );
  const body = await response.json();
  return body.order.folio as string;
}

const change = (
  folio: string,
  data: Record<string, string>,
  options: { accept?: string; cookie?: string } = {},
) =>
  changeStatus(
    request(`http://localhost/api/orders/${folio}/status`, data, options),
    context(folio),
  );

beforeEach(() => {
  process.env.OWNER_PASSWORD = PASSWORD;
  process.env.SESSION_SECRET = "secreto-de-prueba-suficientemente-largo";
  resetWorkshop();
});

describe("contrato de cambio de estado", () => {
  test("sin sesión no se puede cambiar el estado", async () => {
    const response = await change(
      "RM-0001",
      { status: "En diagnóstico" },
      { accept: "application/json" },
    );

    expect(response.status).toBe(401);
  });

  test("con sesión registra el cambio y su historial", async () => {
    const cookie = await sessionCookie();
    const folio = await create(cookie);

    const response = await change(
      folio,
      { status: "En diagnóstico", note: "Ya está en el elevador" },
      { accept: "application/json", cookie },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.order.status).toBe("En diagnóstico");
    expect(body.order.history.at(-1)).toMatchObject({
      from: "Recibido",
      to: "En diagnóstico",
      author: "dueño",
      note: "Ya está en el elevador",
    });
  });

  test("un estado inválido responde 422 y no toca la orden", async () => {
    const cookie = await sessionCookie();
    const folio = await create(cookie);

    const response = await change(
      folio,
      { status: "Pendiente" },
      { accept: "application/json", cookie },
    );

    expect(response.status).toBe(422);
    expect((await response.json()).error).toContain("estado válido");
  });

  test("una orden entregada exige corrección explícita", async () => {
    const cookie = await sessionCookie();
    const folio = await create(cookie);

    await change(
      folio,
      { status: "Entregado" },
      { accept: "application/json", cookie },
    );

    const blocked = await change(
      folio,
      { status: "En reparación" },
      { accept: "application/json", cookie },
    );
    expect(blocked.status).toBe(409);
    expect((await blocked.json()).error).toContain("corrección manual");

    const corrected = await change(
      folio,
      { status: "En reparación", correction: "1", note: "Regresó el auto" },
      { accept: "application/json", cookie },
    );
    const body = await corrected.json();

    expect(corrected.status).toBe(200);
    expect(body.order.status).toBe("En reparación");
    expect(body.order.deliveredAt).toBeNull();
  });

  test("el formulario redirige al detalle con el aviso", async () => {
    const cookie = await sessionCookie();
    const folio = await create(cookie);

    const response = await change(folio, { status: "En diagnóstico" }, { cookie });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(`/ordenes/${folio}?cambio=1`);
  });

  test("una orden inexistente responde 404", async () => {
    const cookie = await sessionCookie();

    const response = await change(
      "RM-9999",
      { status: "En diagnóstico" },
      { accept: "application/json", cookie },
    );

    expect(response.status).toBe(404);
  });
});
