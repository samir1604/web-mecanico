export type DomainErrorCode =
  | "NOT_FOUND"
  | "INVALID_TRANSITION"
  | "QUOTE_NOT_PENDING"
  | "QUOTE_EXPIRED"
  | "VERSION_CONFLICT"
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
