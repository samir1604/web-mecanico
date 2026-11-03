import { sessionFromRequest } from "@/auth/session";
import { json, redirectTo, unauthorized, wantsJson } from "@/http/responses";
import { getWorkshop } from "@/service";

export async function POST(request: Request) {
  if (!sessionFromRequest(request)) return unauthorized();

  const workshop = getWorkshop();
  await workshop.resetDemo();

  if (wantsJson(request)) {
    return json({ ok: true });
  }

  return redirectTo("/?demo=reiniciada");
}
