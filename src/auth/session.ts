import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "tdr_sesion";
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

interface SessionPayload {
  sub: "dueño";
  exp: number;
}

const encode = (value: string) => Buffer.from(value).toString("base64url");
const decode = (value: string) => Buffer.from(value, "base64url").toString("utf8");

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    throw new Error(
      "Falta SESSION_SECRET. Copia .env.example a .env.local y genera un secreto.",
    );
  }
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** Compara sin filtrar el largo ni el contenido por tiempo. */
export function passwordMatches(candidate: string, expected: string): boolean {
  const a = createHash("sha256").update(candidate).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function createSessionValue(now: Date = new Date()): string {
  const payload: SessionPayload = {
    sub: "dueño",
    exp: Math.floor(now.getTime() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const body = encode(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export function verifySessionValue(
  value: string | undefined,
  now: Date = new Date(),
): SessionPayload | null {
  if (!value) return null;

  const [body, signature, extra] = value.split(".");
  if (!body || !signature || extra !== undefined) return null;

  const expected = sign(body);
  const given = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) {
    return null;
  }

  try {
    const payload = JSON.parse(decode(body)) as SessionPayload;
    if (payload.sub !== "dueño" || typeof payload.exp !== "number") return null;
    if (payload.exp <= Math.floor(now.getTime() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return undefined;
}

export function sessionFromRequest(request: Request): SessionPayload | null {
  return verifySessionValue(readCookie(request, SESSION_COOKIE));
}

export function serializeSessionCookie(value: string, maxAge: number): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}
