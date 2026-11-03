import { MemoryStore } from "@/store/memory-store";
import { createWorkshop, type Workshop } from "@/workshop/workshop";

/**
 * Composición para desarrollo y demo.
 *
 * En Vercel cada instancia tiene su propia memoria: este singleton sirve para
 * el esqueleto local. El ticket 02 lo reemplaza por el adaptador de Upstash.
 */
type ServiceHolder = { workshop?: Workshop };

const holder = globalThis as unknown as ServiceHolder;

export function getWorkshop(): Workshop {
  if (!holder.workshop) {
    holder.workshop = createWorkshop({
      store: new MemoryStore(),
      clock: { now: () => new Date() },
    });
  }
  return holder.workshop;
}

/** Solo para tests: vuelve a empezar con un store vacío. */
export function resetWorkshop(): void {
  holder.workshop = undefined;
}
