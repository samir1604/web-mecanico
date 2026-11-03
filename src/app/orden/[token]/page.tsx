import type { Metadata } from "next";

import { getWorkshop } from "@/service";
import { formatDateTime, formatPromiseDate } from "@/ui/format";
import { isDomainError } from "@/workshop/errors";
import type { PublicOrder } from "@/workshop/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tu reparación · Taller Don Ramiro",
  robots: { index: false, follow: false },
};

const transition = (from: string | null, to: string): string =>
  from ? `${from} → ${to}` : to;

function Message({ title, body }: { title: string; body: string }) {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">Taller Don Ramiro</p>
        <h1>{title}</h1>
        <p className="auth-intro muted">{body}</p>
      </section>
    </main>
  );
}

export default async function PublicOrderPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let order: PublicOrder;
  try {
    order = await getWorkshop().publicOrderByToken(token);
  } catch (error) {
    if (isDomainError(error) && error.code === "NOT_FOUND") {
      return (
        <Message
          title="Enlace no válido"
          body="Revisa que el enlace esté completo o pide uno nuevo al taller."
        />
      );
    }
    if (isDomainError(error) && error.code === "LINK_EXPIRED") {
      return (
        <Message
          title="Enlace vencido"
          body="Este enlace ya no está disponible. Pide al taller que te comparta uno nuevo."
        />
      );
    }
    throw error;
  }

  return (
    <main className="public-shell">
      <header className="public-head">
        <p className="eyebrow">Taller Don Ramiro</p>
        <p className="muted">Orden {order.folio}</p>
      </header>

      <section className="status-hero" aria-labelledby="estado-actual">
        <p className="status-hero__label">Estado actual</p>
        <h1 id="estado-actual">{order.status}</h1>
        <p className="status-hero__meta">
          Ingresó el {formatDateTime(order.createdAt)}
        </p>
        {order.promisedAt ? (
          <p className="status-hero__meta">
            Entrega prometida: {formatPromiseDate(order.promisedAt)}
          </p>
        ) : null}
      </section>

      <section className="detail-card" aria-labelledby="tu-vehiculo">
        <h2 id="tu-vehiculo" className="section-title">
          Tu vehículo
        </h2>
        <dl className="detail-list">
          <div>
            <dt>Vehículo</dt>
            <dd>
              {order.vehicle.make} {order.vehicle.model}
            </dd>
          </div>
          <div>
            <dt>Placa</dt>
            <dd className="plate">{order.vehicle.plate}</dd>
          </div>
          <div className="detail-item--wide">
            <dt>Falla reportada</dt>
            <dd>{order.reportedIssue}</dd>
          </div>
        </dl>
      </section>

      <section className="detail-card" aria-labelledby="historial-publico">
        <h2 id="historial-publico" className="section-title">
          Historial
        </h2>
        <ol className="history">
          {[...order.history].reverse().map((entry, index) => (
            <li key={`${entry.at}-${index}`}>
              <div className="history-head">
                <strong>{transition(entry.from, entry.to)}</strong>
                <time dateTime={entry.at}>{formatDateTime(entry.at)}</time>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <p className="public-foot">
        ¿Tienes dudas? Llama al taller y menciona el folio{" "}
        <strong>{order.folio}</strong>.
      </p>
    </main>
  );
}
