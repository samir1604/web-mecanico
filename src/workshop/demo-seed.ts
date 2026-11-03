import type { LineItem, OrderInput } from "./types";
import type { Workshop } from "./workshop";

export interface DemoSeedEntry {
  input: OrderInput;
  quote?: LineItem[];
  advanceToStatus?: "En diagnóstico" | "Listo para entrega" | "Entregado";
  approveQuote?: {
    ip: string;
    userAgent: string;
  };
}

export const DEMO_SEEDS: DemoSeedEntry[] = [
  {
    // Esperando aprobación (con cotización de 2 partidas pendiente)
    input: {
      customer: { name: "Carlos Mendoza", phone: "55 4123 7890" },
      vehicle: { plate: "NXX-4521", make: "Nissan", model: "Versa 2019" },
      reportedIssue: "Vibración al frenar a más de 60 km/h y rechinido constante.",
      internalNotes: "Revisar también líquido de frenos.",
    },
    quote: [
      { concept: "Cambio de balatas de cerámica delanteras", priceCents: 115000 },
      { concept: "Rectificado de discos delanteros", priceCents: 45000 },
    ],
  },
  {
    // En reparación / Aprobada (con cotización aprobada y sello de evidencia)
    input: {
      customer: { name: "Sofía Hernández", phone: "55 6789 1234" },
      vehicle: { plate: "ABC-8832", make: "Volkswagen", model: "Jetta 2017" },
      reportedIssue: "Sobrecalentamiento en tráfico pesado y pérdida de anticongelante.",
      internalNotes: "Fuga detectada en la manguera inferior del radiador.",
    },
    quote: [
      { concept: "Manguera de radiador original", priceCents: 75000 },
      { concept: "Rellenado y purga de anticongelante", priceCents: 35000 },
      { concept: "Mano de obra especializada", priceCents: 50000 },
    ],
    approveQuote: {
      ip: "189.204.112.45",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15",
    },
  },
  {
    // Listo para entrega
    input: {
      customer: { name: "Roberto Gómez", phone: "55 3344 5566" },
      vehicle: { plate: "ZTM-1049", make: "Chevrolet", model: "Aveo 2020" },
      reportedIssue: "Servicio de afinación mayor y cambio de aceite.",
      internalNotes: "Coche lavado y listo para entrega.",
    },
    advanceToStatus: "Listo para entrega",
  },
  {
    // Entregado
    input: {
      customer: { name: "Elena Ramos", phone: "55 8899 0011" },
      vehicle: { plate: "PWE-6712", make: "Mazda", model: "Mazda 3 2018" },
      reportedIssue: "Cambio de amortiguadores traseros y alineación.",
      internalNotes: "Cliente satisfecho, pagó con transferencia.",
    },
    advanceToStatus: "Entregado",
  },
  {
    // En diagnóstico
    input: {
      customer: { name: "Martín Aguilar", phone: "55 1122 3344" },
      vehicle: { plate: "LVK-2384", make: "Toyota", model: "Corolla 2021" },
      reportedIssue: "Testigo de 'Check Engine' intermitente al acelerar.",
      internalNotes: "Escanear con OBD-II para leer códigos de falla.",
    },
    advanceToStatus: "En diagnóstico",
  },
];

/**
 * Siembra las órdenes de demostración usando las operaciones oficiales de dominio.
 * Respeta la máquina de estados, folios secuenciales, cotizaciones y sellos de aprobación.
 */
export async function seedDemo(workshop: Workshop): Promise<void> {
  for (const seed of DEMO_SEEDS) {
    const order = await workshop.createOrder(seed.input);

    if (seed.quote) {
      const quote = await workshop.createQuote(order.folio, seed.quote);

      if (seed.approveQuote) {
        await workshop.approveQuote(order.token, quote.version, seed.approveQuote);
      }
    }

    if (seed.advanceToStatus) {
      if (seed.advanceToStatus === "Entregado") {
        await workshop.changeStatus(order.folio, "En reparación");
        await workshop.changeStatus(order.folio, "Listo para entrega");
        await workshop.changeStatus(order.folio, "Entregado");
      } else if (seed.advanceToStatus === "Listo para entrega") {
        await workshop.changeStatus(order.folio, "En reparación");
        await workshop.changeStatus(order.folio, "Listo para entrega");
      } else if (seed.advanceToStatus === "En diagnóstico") {
        await workshop.changeStatus(order.folio, "En diagnóstico");
      }
    }
  }
}
