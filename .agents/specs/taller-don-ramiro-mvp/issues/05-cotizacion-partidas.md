# 05: Cotización con partidas y paso automático a "Esperando aprobación"

**What to build:** El dueño crea una cotización de reparación adicional con varias partidas (concepto y precio), ve el total calculado solo, y la orden pasa automáticamente a "Esperando aprobación". El cliente ve esa cotización pendiente destacada, con su desglose y total, en su enlace público.

**Blocked by:** 04 (página pública del cliente y caducidad del enlace).

**Status:** done

- [x] Una cotización admite una o más partidas y el total es la suma exacta de los precios, guardados en centavos.
- [x] El total se presenta con formato de moneda USD, por ejemplo `$1,234.00 USD`.
- [x] Crear una cotización vigente mueve la orden a "Esperando aprobación" automáticamente.
- [x] Solo existe una cotización vigente por orden.
- [x] La página del cliente muestra la cotización pendiente arriba y destacada, con partidas y total.
- [x] Los tests de dominio cubren suma de partidas, transición automática y unicidad de la cotización vigente.

## Notas de implementación

- El formulario del detalle permite agregar y quitar partidas, capturar el precio en dólares y ver el total antes de guardar. El total que se persiste siempre lo calcula el dominio en centavos.
- `parseMoneyToCents` acepta `1,234.50`, `$1234.5` y `12`, y rechaza negativos o más de dos decimales. La validación vive en `src/http/quote-form.ts`.
- `POST /api/orders/[folio]/quotes` exige sesión, responde `201` con la cotización o redirige al detalle con `?cotizacion=1`; los errores de dominio se traducen en un solo lugar (`src/http/domain-errors.ts`).
- Una orden terminal no se puede cotizar: primero debe reabrirse con una corrección explícita.
- La proyección pública incluye solo la cotización pendiente, con versión, partidas, total y vigencia. No expone cotizaciones reemplazadas ni datos internos.
- `formatMoney` ahora presenta `$1,234.00 USD` en todo el producto.
