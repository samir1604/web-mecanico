import { redisFromEnv } from "@/store/redis-store";

/**
 * Diagnóstico de configuración. No expone valores: solo si cada variable
 * existe y si Redis responde. Se puede borrar cuando el deploy esté estable.
 */
export async function GET() {
  const env = {
    ownerPassword: Boolean(process.env.OWNER_PASSWORD),
    sessionSecret: Boolean(process.env.SESSION_SECRET),
    upstashUrl: Boolean(process.env.UPSTASH_REDIS_REST_URL),
    upstashToken: Boolean(process.env.UPSTASH_REDIS_REST_TOKEN),
  };

  let redis = "not-configured";
  try {
    const client = redisFromEnv();
    if (client) {
      await client.ping();
      redis = "ok";
    }
  } catch (error) {
    redis = `error:${error instanceof Error ? error.name : "unknown"}`;
  }

  return Response.json(
    {
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      env,
      redis,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
