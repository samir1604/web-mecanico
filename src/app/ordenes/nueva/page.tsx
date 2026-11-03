import type { Metadata } from "next";

import { requireSession } from "@/auth/guard";

export const metadata: Metadata = {
  title: "Nueva orden · Taller Don Ramiro",
};

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireSession();
  const { error } = await searchParams;

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Taller Don Ramiro</p>
          <h1>Nueva orden</h1>
        </div>
        <a className="button button--ghost" href="/">
          Volver
        </a>
      </header>

      {error ? (
        <p className="alert" role="alert">
          {error}
        </p>
      ) : null}

      <form action="/api/orders" method="post" className="stack form-card">
        <fieldset>
          <legend>Cliente</legend>
          <label className="field">
            <span>Nombre</span>
            <input
              type="text"
              name="name"
              required
              maxLength={120}
              autoComplete="name"
              autoCapitalize="words"
            />
          </label>
          <label className="field">
            <span>Teléfono</span>
            <input
              type="tel"
              name="phone"
              required
              maxLength={40}
              inputMode="tel"
              autoComplete="tel"
              placeholder="55 1234 5678"
            />
          </label>
        </fieldset>

        <fieldset>
          <legend>Vehículo</legend>
          <label className="field">
            <span>Placa</span>
            <input
              type="text"
              name="plate"
              required
              maxLength={20}
              autoCapitalize="characters"
              placeholder="ABC-123"
            />
          </label>
          <div className="field-row">
            <label className="field">
              <span>Marca</span>
              <input
                type="text"
                name="make"
                required
                maxLength={60}
                autoCapitalize="words"
                placeholder="Nissan"
              />
            </label>
            <label className="field">
              <span>Modelo</span>
              <input
                type="text"
                name="model"
                required
                maxLength={80}
                autoCapitalize="words"
                placeholder="Versa 2018"
              />
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Trabajo</legend>
          <label className="field">
            <span>Falla reportada por el cliente</span>
            <textarea
              name="reportedIssue"
              required
              maxLength={2000}
              rows={4}
              placeholder="Ruido en la suspensión delantera al pasar topes"
            />
          </label>
          <label className="field">
            <span>
              Promesa de entrega <span className="optional">(opcional)</span>
            </span>
            <input type="date" name="promisedAt" />
          </label>
          <label className="field">
            <span>
              Notas internas <span className="optional">(el cliente no las ve)</span>
            </span>
            <textarea name="internalNotes" maxLength={2000} rows={3} />
          </label>
        </fieldset>

        <button className="button" type="submit">
          Crear orden
        </button>
      </form>
    </main>
  );
}
