import type { DomainError } from "@/workshop/errors";

/** Traduce el código de dominio al estado HTTP del borde. */
export function httpStatusFor(error: DomainError): number {
  switch (error.code) {
    case "NOT_FOUND":
      return 404;
    case "VALIDATION":
      return 422;
    default:
      return 409;
  }
}
