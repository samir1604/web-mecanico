import { describe, expect, test } from "vitest";

import type { Order } from "@/workshop/types";

import { searchOrders } from "./search";

const order = (name: string, plate: string): Order =>
  ({
    customer: { name, phone: "55 1234 5678" },
    vehicle: { plate, make: "Nissan", model: "Versa" },
  }) as Order;

const orders = [
  order("Juan Pérez", "ABC-123"),
  order("María López", "XYZ-987"),
];

describe("búsqueda del tablero", () => {
  test("sin consulta devuelve todas las órdenes", () => {
    expect(searchOrders(orders, "  ")).toHaveLength(2);
  });

  test("encuentra por nombre sin distinguir acentos ni mayúsculas", () => {
    expect(searchOrders(orders, "perez")).toEqual([orders[0]]);
    expect(searchOrders(orders, "MARIA")).toEqual([orders[1]]);
  });

  test("encuentra por placa aunque se omita el guion", () => {
    expect(searchOrders(orders, "abc123")).toEqual([orders[0]]);
    expect(searchOrders(orders, "xyz")).toEqual([orders[1]]);
  });

  test("devuelve vacío cuando no hay coincidencias", () => {
    expect(searchOrders(orders, "Nissan Versa 2018")).toEqual([]);
  });
});
