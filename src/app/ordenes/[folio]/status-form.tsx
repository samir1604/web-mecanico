"use client";

import type { FormEvent } from "react";

import { STATUS_NOTE_MAX_LENGTH, type OrderStatus } from "@/workshop/types";

interface Props {
  folio: string;
  statuses: OrderStatus[];
  terminal: boolean;
}

export function StatusForm({ folio, statuses, terminal }: Props) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const status = new FormData(event.currentTarget).get("status");

    if (
      status === "Cancelado" &&
      !window.confirm(
        "¿Cancelar la orden? Quedará cerrada y conservará todo su historial.",
      )
    ) {
      event.preventDefault();
    }
  }

  return (
    <form
      action={`/api/orders/${folio}/status`}
      method="post"
      className="stack"
      onSubmit={handleSubmit}
    >
      <label className="field">
        <span>Nuevo estado</span>
        <select name="status" required defaultValue="">
          <option value="" disabled>
            Elige un estado
          </option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>
          Nota <span className="optional">(opcional)</span>
        </span>
        <textarea
          name="note"
          rows={3}
          maxLength={STATUS_NOTE_MAX_LENGTH}
          placeholder="Esperando repuesto, el cliente pidió llamada, etc."
        />
      </label>

      {terminal ? (
        <label className="check">
          <input type="checkbox" name="correction" value="1" />
          <span>Confirmo que es una corrección manual de una orden cerrada.</span>
        </label>
      ) : null}

      <button className="button" type="submit">
        Guardar estado
      </button>
    </form>
  );
}
