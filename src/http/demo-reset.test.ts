import { beforeEach, describe, expect, test } from "vitest";

import { POST as resetDemo } from "@/app/api/demo/reset/route";
import { POST as login } from "@/app/api/login/route";
import { getWorkshop, resetWorkshop } from "@/service";

const PASSWORD = "contraseña-de-prueba";

async function sessionCookie(): Promise<string> {
  const response = await login(
    new Request("http://localhost/api/login", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ password: PASSWORD }),
    }),
  );
  const header = response.headers.get("set-cookie");
  if (!header) throw new Error("El login no emitió cookie");
  return header.split(";")[0]!;
}

describe("POST /api/demo/reset", () => {
  beforeEach(() => {
    process.env.OWNER_PASSWORD = PASSWORD;
    process.env.SESSION_SECRET = "secreto-de-sesion-para-tests-con-longitud-adecuada";
    process.env.SEED_DEMO = "false";
    resetWorkshop();
  });

  test("rechaza peticiones sin sesión con 401", async () => {
    const response = await resetDemo(
      new Request("http://localhost/api/demo/reset", {
        method: "POST",
        headers: { accept: "application/json" },
      }),
    );
    expect(response.status).toBe(401);
  });

  test("con sesión reinicia y redirige al tablero con aviso", async () => {
    const cookie = await sessionCookie();

    const response = await resetDemo(
      new Request("http://localhost/api/demo/reset", {
        method: "POST",
        headers: { cookie },
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/?demo=reiniciada");

    const orders = await getWorkshop().listOrders();
    expect(orders).toHaveLength(5);
  });

  test("con sesión y accept: application/json responde 200 { ok: true }", async () => {
    const cookie = await sessionCookie();

    const response = await resetDemo(
      new Request("http://localhost/api/demo/reset", {
        method: "POST",
        headers: { cookie, accept: "application/json" },
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ ok: true });
  });
});
