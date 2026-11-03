export type DomainErrorCode =
  | "NOT_FOUND"
  | "INVALID_TRANSITION"
  | "QUOTE_NOT_PENDING"
  | "QUOTE_EXPIRED"
  | "VERSION_CONFLICT"
  | "LINK_EXPIRED"
  | "VALIDATION";

/**
 * Error de dominio con mensaje apto para mostrarse al usuario.
 * El borde HTTP lo traduce a un código; el dominio no conoce HTTP.
 */
export class DomainError extends Error {
  readonly code: DomainErrorCode;

  constructor(code: DomainErrorCode, message: string) {
    super(message);
    this.name = "DomainError";
    this.code = code;
  }
}

/**
 * Guard estructural además de `instanceof`: Turbopack puede cargar dos copias
 * del módulo en capas distintas y romper la identidad de la clase.
 */
export function isDomainError(error: unknown): error is DomainError {
  if (error instanceof DomainError) return true;
  if (!(error instanceof Error) || error.name !== "DomainError") return false;
  return typeof (error as { code?: unknown }).code === "string";
}
