import type { Order } from "./types";

/** Puerto: la hora es una dependencia, nunca una llamada al sistema. */
export interface Clock {
  now(): Date;
}

/**
 * El almacén rechazó una escritura porque la revisión cambió: alguien más
 * guardó la orden después de que la leímos.
 */
export class RevisionConflict extends Error {
  constructor() {
    super("La orden cambió desde que se leyó.");
    this.name = "RevisionConflict";
  }
}

/**
 * Puerto: el dominio no sabe si detrás hay Upstash Redis o un diccionario.
 *
 * `create` inserta una orden nueva; `save` actualiza solo si la revisión
 * guardada coincide con `expectedRev`. Ambas fallan con `RevisionConflict`
 * en lugar de sobrescribir datos ajenos.
 */
export interface Store {
  nextFolio(): Promise<string>;
  create(order: Order): Promise<void>;
  save(order: Order, expectedRev: number): Promise<void>;
  getByFolio(folio: string): Promise<Order | null>;
  getByToken(token: string): Promise<Order | null>;
  list(): Promise<Order[]>;
}
