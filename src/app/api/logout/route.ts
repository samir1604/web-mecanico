import { serializeSessionCookie } from "@/auth/session";

export async function POST() {
  return new Response(null, {
    status: 303,
    headers: {
      Location: "/login",
      "Set-Cookie": serializeSessionCookie("", 0),
      "Cache-Control": "no-store",
    },
  });
}
