import { isOrderStatus, type OrderStatus } from "@/workshop/types";

export interface StatusChangeInput {
  status: OrderStatus;
  note?: string;
  correction: boolean;
}

const NOTE_MAX_LENGTH = 500;

/**
 * Valida la forma del cambio de estado en el borde HTTP. El dominio vuelve a
 * verificar sus invariantes (estado conocido, transición permitida).
 */
export function parseStatusChange(
  form: FormData,
): StatusChangeInput | { error: string } {
  const status = String(form.get("status") ?? "").trim();

  if (!isOrderStatus(status)) {
    return { error: "Elige un estado válido." };
  }

  const note = String(form.get("note") ?? "").trim().slice(0, NOTE_MAX_LENGTH);
  const correction = ["1", "on", "true", "yes"].includes(
    String(form.get("correction") ?? "").trim().toLowerCase(),
  );

  return { status, note: note || undefined, correction };
}
