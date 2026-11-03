# 12: Datos de demostración y reinicio

**What to build:** La primera vez que se abre la app con el almacén vacío aparecen 4–5 órdenes de ejemplo que cubren los estados principales, para que la demo no empiece en blanco. El panel ofrece "Reiniciar demo" con confirmación, y el seed se puede desactivar por variable de entorno para producción real.

**Blocked by:** 07 (aprobación con evidencia inmutable y paso a "En reparación").

**Status:** done

- [x] Con el almacén vacío, el primer arranque siembra 4–5 órdenes que cubren al menos: esperando aprobación, aprobada, lista para entrega y entregada.
- [x] Los datos sembrados respetan la máquina de estados y las reglas de cotización y evidencia.
- [x] "Reiniciar demo" pide confirmación, borra los datos y vuelve a sembrar los ejemplos.
- [x] Una variable de entorno desactiva el seed para instalaciones reales.
- [x] El guion de demo se completa en un teléfono en 2–3 minutos: crear orden, compartir enlace, ver estado, agregar cotización con foto, aprobar, ver el sello, marcar listo para entrega y verlo del lado del cliente.

## Notas de implementación

- En `src/workshop/demo-seed.ts` se modelan 5 órdenes completas usando únicamente las operaciones de dominio oficiales (`createOrder`, `createQuote`, `approveQuote`, `changeStatus`). Cubren:
  - `RM-0001` (Esperando aprobación con cotización de balatas y discos).
  - `RM-0002` (En reparación con cotización aprobada y evidencia de auditoría inmutable congelada).
  - `RM-0003` (Listo para entrega).
  - `RM-0004` (Entregado con fecha de entrega).
  - `RM-0005` (En diagnóstico).
- `Store.clear()` implementado tanto en `MemoryStore` como en `RedisStore` (limpia claves de folios, tokens, ordenes y secuencia).
- `createWorkshop` expone `seedIfEmpty()` y `resetDemo()`.
- `src/service.ts` ejecuta `seedIfEmpty()` en segundo plano al inicializar el servicio salvo que `SEED_DEMO=false` o `NODE_ENV=test`.
- `POST /api/demo/reset` requiere sesión, ejecuta `resetDemo()` y redirige al tablero con `?demo=reiniciada` (o `{ ok: true }` en JSON).
- `ResetDemoButton` en el tablero solicita confirmación nativa con `window.confirm` antes de enviar la petición.
