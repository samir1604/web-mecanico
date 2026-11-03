"use client";

import { useRef, useState } from "react";

import { parseMoneyToCents } from "@/http/quote-form";
import { formatMoney } from "@/ui/format";

interface Row {
  id: number;
  concept: string;
  price: string;
}

const emptyRow = (id: number): Row => ({ id, concept: "", price: "" });

export function QuoteForm({ folio }: { folio: string }) {
  const nextId = useRef(2);
  const [rows, setRows] = useState<Row[]>([emptyRow(1)]);

  const totalCents = rows.reduce<number | null>((total, row) => {
    if (total === null) return null;
    const cents = parseMoneyToCents(row.price);
    return cents === null ? null : total + cents;
  }, 0);

  const update = (id: number, field: "concept" | "price", value: string) => {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const remove = (id: number) => {
    setRows((current) =>
      current.length === 1
        ? current
        : current.filter((row) => row.id !== id),
    );
  };

  const add = () => {
    const id = nextId.current;
    nextId.current += 1;
    setRows((current) => [...current, emptyRow(id)]);
  };

  return (
    <form
      action={`/api/orders/${encodeURIComponent(folio)}/quotes`}
      method="post"
      className="stack quote-form"
    >
      <div className="quote-rows">
        {rows.map((row, index) => (
          <fieldset key={row.id} className="quote-row">
            <legend>Partida {index + 1}</legend>

            <label className="field">
              <span>Concepto</span>
              <input
                type="text"
                name="concept"
                value={row.concept}
                onChange={(event) =>
                  update(row.id, "concept", event.currentTarget.value)
                }
                required
                maxLength={200}
                autoComplete="off"
                placeholder="Cambio de balatas delanteras"
              />
            </label>

            <label className="field">
              <span>Precio final en USD</span>
              <input
                type="text"
                name="price"
                value={row.price}
                onChange={(event) =>
                  update(row.id, "price", event.currentTarget.value)
                }
                required
                inputMode="decimal"
                autoComplete="off"
                placeholder="1,234.50"
              />
            </label>

            {rows.length > 1 ? (
              <button
                type="button"
                className="button button--ghost button--small"
                onClick={() => remove(row.id)}
              >
                Quitar partida
              </button>
            ) : null}
          </fieldset>
        ))}
      </div>

      <button
        type="button"
        className="button button--ghost"
        onClick={add}
      >
        + Agregar partida
      </button>

      <p className="quote-total" aria-live="polite">
        Total:{" "}
        <strong>{totalCents === null ? "—" : formatMoney(totalCents)}</strong>
      </p>

      <p className="field-hint">
        Los precios son el total que paga el cliente, sin IVA. Al crear la
        cotización, la orden pasa a «Esperando aprobación».
      </p>

      <button className="button" type="submit">
        Crear cotización
      </button>
    </form>
  );
}
