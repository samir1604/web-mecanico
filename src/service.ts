import { MemoryStore } from "@/store/memory-store";
import { RedisStore, redisFromEnv } from "@/store/redis-store";
import type { Store } from "@/workshop/ports";
import { createWorkshop, type Workshop } from "@/workshop/workshop";

/**
 * Composición de la app.
 *
 * - Con Upstash configurado, las órdenes viven en Redis y sobreviven a los
 *   reinicios y despliegues.
 * - Sin credenciales en desarrollo, cae al store en memoria para no bloquear
 *   el recorrido local.
 * - En producción y en tests el comportamiento es explícito: Redis o error.
 */
type ServiceHolder = { workshop?: Workshop; warned?: boolean };

const holder = globalThis as unknown as ServiceHolder;

function buildStore(): Store {
  if (process.env.NODE_ENV === "test") {
    return new MemoryStore();
  }

  const redis = redisFromEnv();
  if (redis) {
    return new RedisStore(redis);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Faltan UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN: el panel no puede usar memoria en producción.",
    );
  }

  if (!holder.warned) {
    holder.warned = true;
    console.warn(
      "[web-mecanico] Sin credenciales de Upstash: usando store en memoria. Los datos se pierden al reiniciar.",
    );
  }

  return new MemoryStore();
}

export function getWorkshop(): Workshop {
  if (!holder.workshop) {
    holder.workshop = createWorkshop({
      store: buildStore(),
      clock: { now: () => new Date() },
    });
  }
  return holder.workshop;
}

/** Solo para tests: vuelve a empezar con un store vacío. */
export function resetWorkshop(): void {
  holder.workshop = undefined;
}
