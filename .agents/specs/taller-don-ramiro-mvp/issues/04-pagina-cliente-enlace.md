# 04: Página pública del cliente y caducidad del enlace

**What to build:** El cliente abre el enlace de su orden sin iniciar sesión y ve el estado actual en grande, el historial, los datos del coche y la falla reportada. No ve notas internas ni otras órdenes. El enlace deja de funcionar 30 días después de que la orden pasa a Entregado.

**Blocked by:** 03 (detalle, cambios de estado, historial y búsqueda).

**Status:** done

- [x] El token abre la página pública sin login y muestra solo el estado actual, el historial, el vehículo y la falla reportada.
- [x] Las notas internas y cualquier otra orden nunca aparecen en la página pública.
- [x] Un token desconocido o inválido responde "enlace no válido" sin revelar datos ni permitir enumeración.
- [x] Una orden entregada muestra "enlace vencido" a los 30 días, verificado con el reloj inyectado.
- [x] Los contratos HTTP cubren token válido, inválido y vencido.

## Notas de implementación

- La página pública vive en `/orden/[token]`, no pide sesión y declara `noindex, nofollow`.
- `publicOrderByToken(token)` devuelve una proyección explícita: folio, estado, vehículo, falla, promesa, ingreso e historial sin autor ni notas. Nunca incluye notas internas, teléfono, token, revisión, cotizaciones ni aprobaciones.
- Token desconocido y token con formato inválido comparten el mensaje "Enlace no válido." (HTTP 404). Un enlace vencido responde 410 con "El enlace venció.".
- La caducidad se evalúa con el reloj del dominio: 30 días desde `deliveredAt`. Si una corrección reabre la orden a un estado no terminal, el enlace vuelve a funcionar; si la deja en `Cancelado`, sigue venciendo a los 30 días de la última entrega para no exponer datos viejos.
- `GET /api/public/orders/[token]` es el contrato público. La página usa el mismo método de dominio y muestra el aviso correspondiente sin filtrar si el token existió.
- El detalle del panel agrega «Ver como cliente» para abrir la página pública de esa orden.
