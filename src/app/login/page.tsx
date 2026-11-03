import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { hasSession } from "@/auth/guard";

export const metadata: Metadata = {
  title: "Entrar · Taller Don Ramiro",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await hasSession()) {
    redirect("/");
  }

  const { error } = await searchParams;

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="login-title">
        <p className="eyebrow">Taller Don Ramiro</p>
        <h1 id="login-title">Panel del taller</h1>
        <p className="muted auth-intro">
          Una sola contraseña. La sesión queda abierta en este teléfono hasta
          que cierres sesión.
        </p>

        {error ? (
          <p className="alert" role="alert">
            Contraseña incorrecta. Intenta de nuevo.
          </p>
        ) : null}

        <form action="/api/login" method="post" className="stack">
          <label className="field">
            <span>Contraseña</span>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              autoFocus
            />
          </label>
          <button className="button" type="submit">
            Entrar
          </button>
        </form>
      </section>
    </main>
  );
}
