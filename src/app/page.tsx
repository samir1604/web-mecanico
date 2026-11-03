import type { Metadata } from "next";

import { requireSession } from "@/auth/guard";
import { getWorkshop } from "@/service";
import { formatDateTime, formatPromiseDate, ORDER_STATUSES } from "@/ui/format";

export const metadata: Metadata = {
  title: "Tablero · Taller Don Ramiro",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ creada?: string }>;
}) {
  await requireSession();

  const [{ creada }, orders] = await Promise.all([
    searchParams,
    getWorkshop().listOrders(),
  ]);

  const groups = ORDER_STATUSES.map((status) => ({
    status,
    orders: orders.filter((order) => order.status === status),
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

      {orders.length === 0 ? (
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
              {orders.length} {orders.length === 1 ? "orden" : "órdenes"}
            </span>
          </div>

          {groups.map((group) => (
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
                  <article className="order-card" key={order.folio}>
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
                  </article>
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </main>
  );
}
