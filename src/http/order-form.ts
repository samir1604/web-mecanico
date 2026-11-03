import type { OrderInput } from "@/workshop/types";

const read = (form: FormData, key: string, maxLength: number): string =>
  String(form.get(key) ?? "").trim().slice(0, maxLength);

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Valida la forma del payload en el borde HTTP. El dominio recibe datos ya
 * limpios y solo verifica sus propias invariantes.
 */
export function parseOrderInput(form: FormData): OrderInput | { error: string } {
  const name = read(form, "name", 120);
  const phone = read(form, "phone", 40);
  const plate = read(form, "plate", 20).toUpperCase();
  const make = read(form, "make", 60);
  const model = read(form, "model", 80);
  const reportedIssue = read(form, "reportedIssue", 2000);
  const internalNotes = read(form, "internalNotes", 2000);
  const promisedAt = read(form, "promisedAt", 10);

  if (!name || !phone || !plate || !make || !model || !reportedIssue) {
    return {
      error:
        "Completa nombre, teléfono, placa, marca, modelo y falla reportada.",
    };
  }

  if (promisedAt && !DATE_ONLY.test(promisedAt)) {
    return { error: "La fecha de entrega no es válida." };
  }

  return {
    customer: { name, phone },
    vehicle: { plate, make, model },
    reportedIssue,
    internalNotes: internalNotes || undefined,
    promisedAt: promisedAt || undefined,
  };
}
