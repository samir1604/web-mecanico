import { Redis } from "@upstash/redis";

/**
 * Diagnóstico de configuración. No expone valores: solo si cada variable
 * existe y si Redis responde. Se puede borrar cuando el deploy esté estable.
 */
export async function GET() {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? "";
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? "";

  const env = {
    ownerPassword: Boolean(process.env.OWNER_PASSWORD),
    sessionSecret: Boolean(process.env.SESSION_SECRET),
    upstashUrl: Boolean(url),
    upstashToken: Boolean(token),
    upstashUrlLooksValid: /^https:\/\/[^\s"']+$/.test(url),
  };

  let redis = "not-configured";
  if (env.upstashUrl && env.upstashToken) {
    try {
      await Redis.fromEnv().ping();
      redis = "ok";
    } catch (error) {
      redis = `error:${error instanceof Error ? error.name : "unknown"}`;
    }
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
