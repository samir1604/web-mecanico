import type { Metadata } from "next";

import { getWorkshop } from "@/service";
import {
  formatDateTime,
  formatMoney,
  formatPromiseDate,
  formatStatusTransition,
} from "@/ui/format";
import { isDomainError } from "@/workshop/errors";
import type { PublicOrder } from "@/workshop/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tu reparación · Taller Don Ramiro",
  robots: { index: false, follow: false },
};

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
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ aprobada?: string; error?: string }>;
}) {
  const [{ token }, { aprobada, error }] = await Promise.all([
    params,
    searchParams,
  ]);

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

  const pendingQuote = order.quote;
  const approval = order.approval;

  return (
    <main className="public-shell">
      <header className="public-head">
        <p className="eyebrow">Taller Don Ramiro</p>
        <p className="muted">Orden {order.folio}</p>
      </header>

      {aprobada ? (
        <p className="notice" role="status">
          ¡Listo! Registramos tu aprobación. El taller comenzará la reparación.
        </p>
      ) : null}

      {error ? (
        <p className="alert" role="alert">
          {error}
        </p>
      ) : null}

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

      {pendingQuote ? (
        <section
          className="quote-card"
          aria-labelledby="cotizacion-pendiente"
        >
          <p className="eyebrow">Cotización pendiente</p>
          <div className="order-head">
            <h2 id="cotizacion-pendiente">Reparación adicional</h2>
            <span className="badge">Versión {pendingQuote.version}</span>
          </div>

          <ul className="item-list">
            {pendingQuote.items.map((item, index) => (
              <li key={`${pendingQuote.version}-${index}`}>
                <span>{item.concept}</span>
                <span>{formatMoney(item.priceCents)}</span>
              </li>
            ))}
          </ul>

          <p className="quote-total">
            Total: <strong>{formatMoney(pendingQuote.totalCents)}</strong>
          </p>
          <p className="field-hint">
            Vence el {formatDateTime(pendingQuote.expiresAt)}. Revisa el
            desglose antes de aprobar.
          </p>

          <form
            action={`/api/public/orders/${encodeURIComponent(token)}/approve`}
            method="post"
            className="approve-form"
          >
            <input
              type="hidden"
              name="version"
              value={pendingQuote.version}
            />
            <button className="button approve-button" type="submit">
              Aprobar cotización
            </button>
          </form>

          <p className="field-hint">
            Al aprobar se guarda un comprobante con la fecha, la hora y datos
            técnicos de tu conexión, junto con esta versión exacta del
            desglose.
          </p>
        </section>
      ) : null}

      {approval ? (
        <section
          className="approval-receipt"
          aria-labelledby="comprobante-aprobacion"
        >
          <p className="eyebrow">Comprobante de aprobación</p>
          <div className="order-head">
            <h2 id="comprobante-aprobacion">Folio {approval.id}</h2>
            <span className="badge">Versión {approval.quoteVersion}</span>
          </div>

          <ul className="item-list">
            {approval.items.map((item, index) => (
              <li key={`${approval.id}-${index}`}>
                <span>{item.concept}</span>
                <span>{formatMoney(item.priceCents)}</span>
              </li>
            ))}
          </ul>

          <p className="quote-total">
            Total aprobado: <strong>{formatMoney(approval.totalCents)}</strong>
          </p>
          <p className="field-hint">
            Aprobado el {formatDateTime(approval.approvedAt)}. Este comprobante
            conserva la copia exacta de lo que aceptaste y no cambia si el
            taller edita la cotización.
          </p>
        </section>
      ) : null}

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
                <strong>
                  {formatStatusTransition(entry.from, entry.to)}
                </strong>
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
