import { Redis } from "@upstash/redis";

import { RevisionConflict, type Store } from "../workshop/ports";
import type { Order } from "../workshop/types";

const orderKey = (folio: string) => `orden:${folio}`;
const tokenKey = (token: string) => `token:${token}`;
const FOLIOS = "ordenes:folios";
const SEQUENCE = "ordenes:secuencia";

/**
 * Compara y escribe en una sola operación del servidor: si la revisión guardada
 * no es la esperada, no toca nada. Evita que dos escrituras se pisen.
 */
const SAVE_IF_REV = `
local current = redis.call('GET', KEYS[1])
if not current then return -1 end
local doc = cjson.decode(current)
if tostring(doc.rev) ~= ARGV[2] then return 0 end
redis.call('SET', KEYS[1], ARGV[1])
return 1
`;

/** Acepta valores pegados con comillas desde un panel o un `.env`. */
function unquote(value: string | undefined): string {
  const trimmed = (value ?? "").trim();
  const match = trimmed.match(/^(["'])([\s\S]*)\1$/);
  return match ? match[2].trim() : trimmed;
}

/**
 * Crea el cliente solo si ambas credenciales existen. Devuelve `null` cuando
 * faltan, para que quien componga el servicio decida el respaldo.
 */
export function redisFromEnv(): Redis | null {
  const url = unquote(process.env.UPSTASH_REDIS_REST_URL);
  const token = unquote(process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export class RedisStore implements Store {
  #redis: Redis;

  constructor(redis: Redis) {
    this.#redis = redis;
  }

  async nextFolio(): Promise<string> {
    const sequence = await this.#redis.incr(SEQUENCE);
    return `RM-${String(sequence).padStart(4, "0")}`;
  }

  async create(order: Order): Promise<void> {
    const created = await this.#redis.set(orderKey(order.folio), order, {
      nx: true,
    });
    if (created === null) {
      throw new RevisionConflict();
    }

    await this.#redis.set(tokenKey(order.token), { folio: order.folio });
    await this.#redis.sadd(FOLIOS, order.folio);
  }

  async save(order: Order, expectedRev: number): Promise<void> {
    const result = await this.#redis.eval(
      SAVE_IF_REV,
      [orderKey(order.folio)],
      [JSON.stringify(order), String(expectedRev)],
    );

    if (result !== 1) {
      throw new RevisionConflict();
    }
  }

  async getByFolio(folio: string): Promise<Order | null> {
    const order = await this.#redis.get<Order>(orderKey(folio));
    return order ?? null;
  }

  async getByToken(token: string): Promise<Order | null> {
    const index = await this.#redis.get<{ folio: string }>(tokenKey(token));
    return index ? this.getByFolio(index.folio) : null;
  }

  async list(): Promise<Order[]> {
    const folios = await this.#redis.smembers(FOLIOS);
    if (folios.length === 0) return [];

    const orders = await this.#redis.mget<Order[]>(
      ...folios.map((folio) => orderKey(folio)),
    );

    return orders
      .filter((order): order is Order => order !== null)
      .sort((a, b) => a.folio.localeCompare(b.folio));
  }
}
