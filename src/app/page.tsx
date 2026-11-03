import type { Metadata } from "next";

import { requireSession } from "@/auth/guard";
import { getWorkshop } from "@/service";
import { formatDateTime, formatPromiseDate } from "@/ui/format";
import { ORDER_STATUSES } from "@/workshop/types";

export const metadata: Metadata = {
  title: "Tablero · Taller Don Ramiro",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ creada?: string; q?: string }>;
}) {
  await requireSession();

  const { creada, q } = await searchParams;
  const query = (q ?? "").trim();
  const visible = await getWorkshop().searchOrders(query);
  const hasOrders = query.length > 0 || visible.length > 0;

  const groups = ORDER_STATUSES.map((status) => ({
    status,
    orders: visible.filter((order) => order.status === status),
  })).filter((group) => group.orders.length > 0);

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Taller Don Ramiro</p>
          <h1>Tablero</h1>
        </div>
        <form action="/api/logout" method="post">
          <button className="button button--ghost" type="submit">
            Salir
          </button>
        </form>
      </header>

      {creada ? (
        <p className="notice" role="status">
          Orden <strong>{creada}</strong> creada. Ya aparece en el tablero.
        </p>
      ) : null}

      {!hasOrders ? (
        <section className="empty">
          <h2>Aún no hay órdenes</h2>
          <p className="muted">
            Crea la primera desde el teléfono. El tablero se agrupa por estado
            solo.
          </p>
          <a className="button" href="/ordenes/nueva">
            Nueva orden
          </a>
        </section>
      ) : (
        <>
          <div className="create-bar">
            <a className="button" href="/ordenes/nueva">
              + Nueva orden
            </a>
            <span className="muted count">
              {visible.length} {visible.length === 1 ? "orden" : "órdenes"}
            </span>
          </div>

          <form className="search-bar" action="/" method="get" role="search">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Placa o nombre del cliente"
              aria-label="Buscar por placa o nombre del cliente"
            />
            <button className="button" type="submit">
              Buscar
            </button>
          </form>

          {query ? (
            <p className="search-summary muted">
              Resultados para «{query}».{" "}
              <a href="/">Limpiar búsqueda</a>
            </p>
          ) : null}

          {groups.length === 0 ? (
            <section className="empty">
              <h2>Sin resultados</h2>
              <p className="muted">
                No hay órdenes que coincidan con «{query}». Prueba con otra
                placa o nombre.
              </p>
              <a className="button button--ghost" href="/">
                Ver todas
              </a>
            </section>
          ) : (
            groups.map((group) => (
              <section
                className="status-group"
                key={group.status}
                aria-labelledby={`grupo-${group.status}`}
              >
                <div className="group-head">
                  <h2 id={`grupo-${group.status}`}>{group.status}</h2>
                  <span className="count">{group.orders.length}</span>
                </div>

                <div className="order-list">
                  {group.orders.map((order) => (
                    <a
                      className="order-card"
                      key={order.folio}
                      href={`/ordenes/${order.folio}`}
                      aria-label={`Ver detalle de la orden ${order.folio}, ${order.customer.name}`}
                    >
                      <div className="order-head">
                        <span className="folio">{order.folio}</span>
                        <span className="plate">{order.vehicle.plate}</span>
                      </div>
                      <h3>{order.customer.name}</h3>
                      <p className="muted">
                        {order.vehicle.make} {order.vehicle.model}
                      </p>
                      <p className="issue">{order.reportedIssue}</p>
                      <p className="meta">
                        Ingreso: {formatDateTime(order.createdAt)}
                      </p>
                      {order.promisedAt ? (
                        <p className="meta">
                          Promesa: {formatPromiseDate(order.promisedAt)}
                        </p>
                      ) : null}
                      <p className="more">Ver detalle →</p>
                    </a>
                  ))}
                </div>
              </section>
            ))
          )}
        </>
      )}
    </main>
  );
}
