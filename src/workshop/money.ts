/**
 * Convierte un monto escrito en dólares (`1,234.50`, `$1234.5`) a centavos
 * enteros. Evita aritmética flotante antes de que el dominio sume.
 */
export function parseMoneyToCents(raw: string): number | null {
  const normalized = raw.trim().replace(/[$,\s]/g, "");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;

  const [whole, fraction = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));

  return Number.isSafeInteger(cents) ? cents : null;
}
