import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE, verifySessionValue } from "./session";

export async function hasSession(): Promise<boolean> {
  const jar = await cookies();
  return verifySessionValue(jar.get(SESSION_COOKIE)?.value) !== null;
}

/** Para páginas del panel: sin sesión, al login. */
export async function requireSession(): Promise<void> {
  if (!(await hasSession())) {
    redirect("/login");
  }
}
