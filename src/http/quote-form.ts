import type { LineItem } from "@/workshop/types";

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

export function parseQuoteForm(
  form: FormData,
): LineItem[] | { error: string } {
  const concepts = form.getAll("concept").map(String);
  const prices = form.getAll("price").map(String);

  if (concepts.length !== prices.length) {
    return { error: "La cotización está incompleta. Recarga e inténtalo de nuevo." };
  }

  const items: LineItem[] = [];

  for (let index = 0; index < concepts.length; index += 1) {
    const concept = concepts[index]!.trim();
    const rawPrice = prices[index]!.trim();

    if (!concept && !rawPrice) continue;

    if (!concept) {
      return { error: "Cada partida necesita un concepto." };
    }

    const priceCents = parseMoneyToCents(rawPrice);
    if (priceCents === null) {
      return {
        error:
          "El precio de cada partida debe ser un monto en USD, por ejemplo 1,234.50.",
      };
    }

    items.push({ concept, priceCents });
  }

  if (items.length === 0) {
    return { error: "Agrega al menos una partida." };
  }

  return items;
}
