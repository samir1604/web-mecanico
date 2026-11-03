import { describe, expect, test } from "vitest";

import { parseMoneyToCents } from "@/workshop/money";

import { parseQuoteForm } from "./quote-form";

const formWith = (rows: Array<[string, string]>): FormData => {
  const form = new FormData();
  for (const [concept, price] of rows) {
    form.append("concept", concept);
    form.append("price", price);
  }
  return form;
};

describe("partidas de cotización", () => {
  test("convierte pesos con centavos a centavos exactos", () => {
    expect(parseMoneyToCents("1,234.50")).toBe(123450);
    expect(parseMoneyToCents("$1,234.5")).toBe(123450);
    expect(parseMoneyToCents("0.05")).toBe(5);
    expect(parseMoneyToCents("12")).toBe(1200);
  });

  test("rechaza precios inválidos o con más de dos decimales", () => {
    expect(parseMoneyToCents("")).toBeNull();
    expect(parseMoneyToCents("-1")).toBeNull();
    expect(parseMoneyToCents("abc")).toBeNull();
    expect(parseMoneyToCents("1.234")).toBeNull();
  });

  test("acepta varias partidas e ignora filas completamente vacías", () => {
    const parsed = parseQuoteForm(
      formWith([
        ["Balatas", "1,200.00"],
        ["", ""],
        ["Rectificado", "450"],
      ]),
    );

    expect(parsed).toEqual([
      { concept: "Balatas", priceCents: 120000 },
      { concept: "Rectificado", priceCents: 45000 },
    ]);
  });

  test("exige al menos una partida con concepto y precio", () => {
    expect(parseQuoteForm(formWith([]))).toMatchObject({ error: expect.any(String) });
    expect(parseQuoteForm(formWith([["", "100"]]))).toMatchObject({
      error: expect.any(String),
    });
    expect(parseQuoteForm(formWith([["Balatas", ""]]))).toMatchObject({
      error: expect.any(String),
    });
  });
});
