/** La aprobación del cliente llega con la versión exacta que está viendo. */
export function parseApprovalForm(
  form: FormData,
): { version: number } | { error: string } {
  const raw = form.get("version");
  const version = typeof raw === "string" ? Number(raw.trim()) : Number.NaN;

  if (!Number.isInteger(version) || version < 1) {
    return {
      error: "No se pudo identificar la cotización. Recarga la página.",
    };
  }

  return { version };
}

/**
 * Datos de la petición que forman parte de la evidencia. En Vercel la IP real
 * viene en `x-forwarded-for`; se toma la primera entrada de la cadena.
 */
export function requestEvidence(request: Request): {
  ip: string;
  userAgent: string;
} {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    (forwarded?.split(",")[0] ?? request.headers.get("x-real-ip") ?? "").trim() ||
    "desconocida";
  const userAgent = request.headers.get("user-agent")?.trim() || "desconocido";

  return { ip, userAgent };
}
