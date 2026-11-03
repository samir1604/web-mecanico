import type { Order } from "../workshop/types";
import type { Store } from "../workshop/ports";

/** Adaptador en memoria del puerto Store. En producción: Upstash Redis. */
export class MemoryStore implements Store {
  #byFolio = new Map<string, Order>();
  #tokenToFolio = new Map<string, string>();
  #sequence = 0;

  async nextFolio(): Promise<string> {
    this.#sequence += 1;
    return `RM-${String(this.#sequence).padStart(4, "0")}`;
  }

  async save(order: Order): Promise<void> {
    this.#byFolio.set(order.folio, structuredClone(order));
    this.#tokenToFolio.set(order.token, order.folio);
  }

  async getByFolio(folio: string): Promise<Order | null> {
    const order = this.#byFolio.get(folio);
    return order ? structuredClone(order) : null;
  }

  async getByToken(token: string): Promise<Order | null> {
    const folio = this.#tokenToFolio.get(token);
    return folio ? this.getByFolio(folio) : null;
  }

  async list(): Promise<Order[]> {
    return [...this.#byFolio.values()].map((order) => structuredClone(order));
  }
}
