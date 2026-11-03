import type { Order } from "@/workshop/types";

const normalize = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const plateKey = (value: string): string =>
  normalize(value).replace(/[^a-z0-9]/g, "");

/**
 * Filtra el tablero por nombre del cliente o placa. Ignora acentos, mayúsculas
 * y separadores de placa (`ABC-123` coincide con `abc123`).
 */
export function searchOrders(orders: Order[], query: string): Order[] {
  const term = normalize(query);
  if (!term) return orders;

  const plateTerm = plateKey(query);

  return orders.filter(
    (order) =>
      normalize(order.customer.name).includes(term) ||
      (plateTerm.length > 0 && plateKey(order.vehicle.plate).includes(plateTerm)),
  );
}
