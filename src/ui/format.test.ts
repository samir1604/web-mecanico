import { describe, expect, test } from "vitest";

import { formatMoney } from "./format";

describe("formato de dinero", () => {
  test("presenta centavos como dólares con separador de miles y sufijo USD", () => {
    expect(formatMoney(123400)).toBe("$1,234.00 USD");
    expect(formatMoney(5)).toBe("$0.05 USD");
  });
});
