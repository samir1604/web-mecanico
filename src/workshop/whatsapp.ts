/**
 * Normaliza un teléfono mexicano a los dígitos que espera `wa.me`.
 *
 * Acepta 10 dígitos locales, `+52` con o sin el `1` de móvil y los prefijos
 * antiguos `044`/`045`. Devuelve `null` cuando no se puede interpretar como un
 * número mexicano de 10 dígitos; nunca devuelve el signo `+`.
 */
export function normalizeMexicanPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  let local: string;

  if (digits.length === 10) {
    local = digits;
  } else if (digits.length === 12 && digits.startsWith("52")) {
    local = digits.slice(2);
  } else if (digits.length === 13 && digits.startsWith("521")) {
    local = digits.slice(3);
  } else if (
    digits.length === 13 &&
    (digits.startsWith("044") || digits.startsWith("045"))
  ) {
    local = digits.slice(3);
  } else {
    return null;
  }

  // Los números mexicanos no empiezan con 0 ni 1; así se descartan capturas
  // incompletas o extensiones sin lada.
  return /^[2-9]\d{9}$/.test(local) ? `52${local}` : null;
}

/** Mensaje prellenado que acompaña al enlace público de la orden. */
export function buildShareMessage(input: {
  customerName: string;
  folio: string;
  publicUrl: string;
}): string {
  return `Hola ${input.customerName}, le escribo de Taller Don Ramiro. Puede consultar el estado de su orden ${input.folio} aquí: ${input.publicUrl}`;
}

/**
 * Construye el enlace `wa.me` con el teléfono ya normalizado. Es una
 * integración manual: abrir la URL inicia la conversación, nada se envía desde
 * el servidor.
 */
export function whatsAppUrl(rawPhone: string, message: string): string | null {
  const phone = normalizeMexicanPhone(rawPhone);
  if (!phone) return null;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
