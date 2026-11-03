import { beforeEach, describe, expect, test } from "vitest";

import { POST as login } from "@/app/api/login/route";
import { POST as logout } from "@/app/api/logout/route";
import { GET as listOrders, POST as createOrder } from "@/app/api/orders/route";
import {
  createSessionValue,
  SESSION_COOKIE,
  verifySessionValue,
} from "@/auth/session";
import { resetWorkshop } from "@/service";

const PASSWORD = "contraseña-de-prueba";

const formRequest = (
  url: string,
  data: Record<string, string>,
  accept?: string,
  cookie?: string,
) =>
  new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      ...(accept ? { accept } : {}),
      ...(cookie ? { cookie } : {}),
    },
    body: new URLSearchParams(data),
  });

const validOrder = {
  name: "Juan Pérez",
  phone: "55 1234 5678",
  plate: "abc-123",
  make: "Nissan",
  model: "Versa 2018",
  reportedIssue: "Ruido en la suspensión delantera",
};

async function sessionCookie(): Promise<string> {
  const response = await login(formRequest("http://localhost/api/login", {
    password: PASSWORD,
  }));
  const header = response.headers.get("set-cookie");
  if (!header) throw new Error("El login no emitió cookie");
  return header.split(";")[0]!;
}

beforeEach(() => {
  process.env.OWNER_PASSWORD = PASSWORD;
  process.env.SESSION_SECRET = "secreto-de-prueba-suficientemente-largo";
  resetWorkshop();
});

describe("login", () => {
  test("con la contraseña correcta abre el panel y firma la cookie", async () => {
    const response = await login(
      formRequest("http://localhost/api/login", { password: PASSWORD }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/");

    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toContain(`${SESSION_COOKIE}=`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Max-Age=2592000");
  });

  test("con la contraseña incorrecta no emite cookie", async () => {
    const response = await login(
      formRequest("http://localhost/api/login", { password: "incorrecta" }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/login?error=1");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  test("cerrar sesión borra la cookie", async () => {
    const response = await logout();

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/login");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});

describe("sesión", () => {
  test("una cookie alterada no vale", async () => {
    const cookie = await sessionCookie();
    const tampered = cookie.replace(/.$/, (char) =>
      char === "A" ? "B" : "A",
    );

    const response = await listOrders(
      new Request("http://localhost/api/orders", {
        headers: { cookie: tampered },
      }),
    );

    expect(response.status).toBe(401);
  });

  test("una sesión vencida no vale", () => {
    const expired = createSessionValue(new Date(Date.now() - 31 * 24 * 3600 * 1000));

    expect(verifySessionValue(expired)).toBeNull();
  });
});

describe("contratos de órdenes", () => {
  test("sin sesión no se puede leer el tablero", async () => {
    const response = await listOrders(
      new Request("http://localhost/api/orders"),
    );

    expect(response.status).toBe(401);
  });

  test("sin sesión no se puede crear una orden", async () => {
    const response = await createOrder(
      formRequest("http://localhost/api/orders", validOrder, "application/json"),
    );

    expect(response.status).toBe(401);
  });

  test("con sesión, crear una orden la devuelve y aparece en el tablero", async () => {
    const cookie = await sessionCookie();

    const created = await createOrder(
      formRequest(
        "http://localhost/api/orders",
        validOrder,
        "application/json",
        cookie,
      ),
    );
    const body = await created.json();

    expect(created.status).toBe(201);
    expect(body.order.folio).toBe("RM-0001");
    expect(body.order.status).toBe("Recibido");
    expect(body.order.vehicle).toEqual({
      plate: "ABC-123",
      make: "Nissan",
      model: "Versa 2018",
    });

    const listed = await listOrders(
      new Request("http://localhost/api/orders", { headers: { cookie } }),
    );

    expect(listed.status).toBe(200);
    expect((await listed.json()).orders).toHaveLength(1);
  });

  test("el formulario redirige al tablero con el folio creado", async () => {
    const cookie = await sessionCookie();

    const response = await createOrder(
      new Request("http://localhost/api/orders", {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          cookie,
        },
        body: new URLSearchParams(validOrder),
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/?creada=RM-0001");
  });

  test("un payload incompleto no crea nada", async () => {
    const cookie = await sessionCookie();

    const response = await createOrder(
      formRequest(
        "http://localhost/api/orders",
        { ...validOrder, plate: "" },
        "application/json",
        cookie,
      ),
    );

    expect(response.status).toBe(422);
    expect((await response.json()).error).toContain("Completa");
  });
});
