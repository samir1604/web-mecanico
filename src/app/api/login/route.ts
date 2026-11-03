import {
  createSessionValue,
  passwordMatches,
  serializeSessionCookie,
  SESSION_MAX_AGE_SECONDS,
} from "@/auth/session";

const seeOther = (location: string, headers: Record<string, string> = {}) =>
  new Response(null, {
    status: 303,
    headers: { Location: location, "Cache-Control": "no-store", ...headers },
  });

export async function POST(request: Request) {
  const expected = process.env.OWNER_PASSWORD;
  if (!expected) {
    return new Response(
      "El panel no está configurado: falta OWNER_PASSWORD.",
      { status: 500 },
    );
  }

  const form = await request.formData();
  const password = String(form.get("password") ?? "");

  if (!password || !passwordMatches(password, expected)) {
    return seeOther("/login?error=1");
  }

  return seeOther("/", {
    "Set-Cookie": serializeSessionCookie(
      createSessionValue(),
      SESSION_MAX_AGE_SECONDS,
    ),
  });
}
