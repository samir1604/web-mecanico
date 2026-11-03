import { describe, expect, test } from "vitest";

import {
  buildShareMessage,
  normalizeMexicanPhone,
  whatsAppUrl,
} from "./whatsapp";

describe("teléfono mexicano para WhatsApp", () => {
  test("normaliza un número local de 10 dígitos a +52 sin el 1 de móvil", () => {
    expect(normalizeMexicanPhone("55 1234 5678")).toBe("525512345678");
    expect(normalizeMexicanPhone("(55) 1234-5678")).toBe("525512345678");
  });

  test("quita el 1 de móvil cuando el número ya trae lada", () => {
    expect(normalizeMexicanPhone("+52 1 55 1234 5678")).toBe(
      "525512345678",
    );
    expect(normalizeMexicanPhone("5215512345678")).toBe("525512345678");
    expect(normalizeMexicanPhone("+52 (55) 1234 5678")).toBe(
      "525512345678",
    );
  });

  test("tolera los prefijos antiguos 044 y 045", () => {
    expect(normalizeMexicanPhone("044 55 1234 5678")).toBe("525512345678");
    expect(normalizeMexicanPhone("045 55 1234 5678")).toBe("525512345678");
  });

  test("rechaza teléfonos que no son números mexicanos válidos", () => {
    expect(normalizeMexicanPhone("")).toBeNull();
    expect(normalizeMexicanPhone("55 1234 567")).toBeNull();
    expect(normalizeMexicanPhone("000 000 0000")).toBeNull();
    expect(normalizeMexicanPhone("ext. 123")).toBeNull();
    expect(normalizeMexicanPhone("+1 555 123 4567")).toBeNull();
  });
});

describe("enlace de WhatsApp", () => {
  test("usa wa.me con el número normalizado y el mensaje codificado", () => {
    const message = buildShareMessage({
      customerName: "Juan Pérez",
      folio: "RM-0001",
      publicUrl: "https://taller.example/orden/token",
    });

    const url = whatsAppUrl("+52 1 55 1234 5678", message);

    expect(message).toContain("RM-0001");
    expect(message).toContain("https://taller.example/orden/token");
    expect(url).toBe(
      `https://wa.me/525512345678?text=${encodeURIComponent(message)}`,
    );
    expect(url).not.toMatch(/wa\.me\/521/);
  });

  test("no genera enlace cuando el teléfono es inválido", () => {
    expect(whatsAppUrl("12345", "Hola")).toBeNull();
  });
});
