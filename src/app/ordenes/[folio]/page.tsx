import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireSession } from "@/auth/guard";
import { getWorkshop } from "@/service";
import { formatDateTime, formatMoney, formatPromiseDate } from "@/ui/format";
import {
  isTerminalStatus,
  ORDER_STATUSES,
  type HistoryEntry,
} from "@/workshop/types";

import { StatusForm } from "./status-form";

export const metadata: Metadata = {
  title: "Detalle de la orden · Taller Don Ramiro",
};

export const dynamic = "force-dynamic";

const AUTHOR_LABEL: Record<HistoryEntry["author"], string> = {
  "dueño": "Dueño",
  cliente: "Cliente",
  sistema: "Sistema",
};

const transition = (entry: HistoryEntry): string =>
  entry.from ? `${entry.from} → ${entry.to}` : entry.to;

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ folio: string }>;
  searchParams: Promise<{ cambio?: string; error?: string }>;
}) {
  await requireSession();

  const [{ folio }, { cambio, error }] = await Promise.all([
    params,
    searchParams,
  ]);

  const order = await getWorkshop().findByFolio(folio);
  if (!order) notFound();

  const terminal = isTerminalStatus(order.status);
  const nextStatuses = ORDER_STATUSES.filter(
    (status) => status !== order.status,
  );

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Orden {order.folio}</p>
          <h1>Detalle</h1>
        </div>
        <a className="button button--ghost" href="/">
          Volver
        </a>
      </header>

      {cambio ? (
        <p className="notice" role="status">
          Estado actualizado a <strong>{order.status}</strong>.
        </p>
      ) : null}

      {error ? (
        <p className="alert" role="alert">
          {error}
        </p>
      ) : null}

      <section className="detail-card" aria-label="Datos de la orden">
        <div className="order-head">
          <span className="folio">{order.folio}</span>
          <span className={terminal ? "badge badge--terminal" : "badge"}>
            {order.status}
          </span>
        </div>

        <dl className="detail-list">
          <div>
            <dt>Cliente</dt>
            <dd>{order.customer.name}</dd>
          </div>
          <div>
            <dt>Teléfono</dt>
            <dd>
              <a href={`tel:${order.customer.phone}`}>{order.customer.phone}</a>
            </dd>
          </div>
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
          <div>
            <dt>Ingreso</dt>
            <dd>{formatDateTime(order.createdAt)}</dd>
          </div>
          <div>
            <dt>Promesa de entrega</dt>
            <dd>
              {order.promisedAt
                ? formatPromiseDate(order.promisedAt)
                : "Sin promesa"}
            </dd>
          </div>
          {order.deliveredAt ? (
            <div>
              <dt>Entrega</dt>
              <dd>{formatDateTime(order.deliveredAt)}</dd>
            </div>
          ) : null}
          <div className="detail-item--wide">
            <dt>Falla reportada por el cliente</dt>
            <dd>{order.reportedIssue}</dd>
          </div>
          <div className="detail-item--wide">
            <dt>Notas internas</dt>
            <dd>
              {order.internalNotes ? (
                <p className="internal-notes">{order.internalNotes}</p>
              ) : (
                <span className="muted">Sin notas internas.</span>
              )}
              <span className="field-hint">
                Solo visibles en el panel; nunca en el enlace del cliente.
              </span>
            </dd>
          </div>
        </dl>
      </section>

      {order.quotes.length > 0 ? (
        <section className="detail-card" aria-labelledby="cotizaciones">
          <h2 id="cotizaciones" className="section-title">
            Cotizaciones
          </h2>
          <ul className="quote-list">
            {order.quotes.map((quote) => (
              <li key={quote.version}>
                <div className="order-head">
                  <strong>Versión {quote.version}</strong>
                  <span className="badge">{quote.status}</span>
                </div>
                <p className="muted">
                  {formatDateTime(quote.createdAt)} · Vence{" "}
                  {formatDateTime(quote.expiresAt)}
                </p>
                <ul className="item-list">
                  {quote.items.map((item, index) => (
                    <li key={`${quote.version}-${index}`}>
                      <span>{item.concept}</span>
                      <span>{formatMoney(item.priceCents)}</span>
                    </li>
                  ))}
                </ul>
                <p className="quote-total">
                  Total: <strong>{formatMoney(quote.totalCents)}</strong>
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="detail-card" aria-labelledby="cambiar-estado">
        <h2 id="cambiar-estado" className="section-title">
          Cambiar estado
        </h2>

        {terminal ? (
          <p className="alert" role="note">
            La orden está en «{order.status}» y es un estado terminal. Para
            moverla, marca la corrección manual.
          </p>
        ) : null}

        <StatusForm
          folio={order.folio}
          statuses={nextStatuses}
          terminal={terminal}
        />

        <p className="field-hint">
          Cancelar mueve la orden a «Cancelado» sin borrar su historial.
        </p>
      </section>

      <section className="detail-card" aria-labelledby="historial">
        <h2 id="historial" className="section-title">
          Historial
        </h2>

        <ol className="history">
          {[...order.history].reverse().map((entry, index) => (
            <li key={`${entry.at}-${index}`}>
              <div className="history-head">
                <strong>{transition(entry)}</strong>
                <time dateTime={entry.at}>{formatDateTime(entry.at)}</time>
              </div>
              <p className="muted">{AUTHOR_LABEL[entry.author]}</p>
              {entry.note ? <p className="history-note">{entry.note}</p> : null}
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
