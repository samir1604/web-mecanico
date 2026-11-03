import type { Order } from "./types";

/** Puerto: la hora es una dependencia, nunca una llamada al sistema. */
export interface Clock {
  now(): Date;
}

/**
 * Puerto: el dominio no sabe si detrás hay Upstash Redis o un diccionario.
 *
 * `save` todavía no verifica revisión. La concurrencia optimista se agrega en
 * el ticket de persistencia, cuando exista el adaptador real.
 */
export interface Store {
  nextFolio(): Promise<string>;
  save(order: Order): Promise<void>;
  getByFolio(folio: string): Promise<Order | null>;
  getByToken(token: string): Promise<Order | null>;
  list(): Promise<Order[]>;
}
