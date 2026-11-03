import type { Order } from "../workshop/types";
import { RevisionConflict, type Store } from "../workshop/ports";

/** Adaptador en memoria del puerto Store, para tests y desarrollo sin Redis. */
export class MemoryStore implements Store {
  #byFolio = new Map<string, Order>();
  #tokenToFolio = new Map<string, string>();
  #sequence = 0;

  async nextFolio(): Promise<string> {
    this.#sequence += 1;
    return `RM-${String(this.#sequence).padStart(4, "0")}`;
  }

  async create(order: Order): Promise<void> {
    if (this.#byFolio.has(order.folio)) {
      throw new RevisionConflict();
    }
    this.#write(order);
  }

  async save(order: Order, expectedRev: number): Promise<void> {
    const current = this.#byFolio.get(order.folio);
    if (!current || current.rev !== expectedRev) {
      throw new RevisionConflict();
    }
    this.#write(order);
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

  async clear(): Promise<void> {
    this.#byFolio.clear();
    this.#tokenToFolio.clear();
    this.#sequence = 0;
  }

  #write(order: Order): void {
    this.#byFolio.set(order.folio, structuredClone(order));
    this.#tokenToFolio.set(order.token, order.folio);
  }
}
