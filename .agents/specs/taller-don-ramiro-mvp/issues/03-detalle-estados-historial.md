# 03: Detalle, cambios de estado, historial y búsqueda

**What to build:** El dueño abre una orden, cambia su estado con una nota opcional y ve el historial completo con autor, fecha y nota. Las transiciones respetan la máquina de estados y Entregado/Cancelado son terminales salvo corrección explícita. Desde el tablero puede buscar por placa o por nombre del cliente.

**Blocked by:** 01 (esqueleto caminante con store en memoria).

**Status:** done

- [x] El detalle muestra todos los datos de la orden, incluidas las notas internas, y estas nunca aparecen en superficies públicas.
- [x] Cambiar de estado registra autor (dueño), fecha/hora y nota opcional en el historial.
- [x] Solo se permiten las transiciones de la máquina de estados; Entregado y Cancelado quedan terminales salvo corrección manual explícita.
- [x] Cancelar una orden la saca del flujo sin borrar su historial.
- [x] La búsqueda filtra el tablero por placa o nombre de cliente.
- [x] Los tests de dominio cubren transiciones válidas e inválidas, registro de historial y reglas terminales.

## Notas de implementación

- El dominio expone `changeStatus(folio, estado, nota?, { correction? })`; no conoce HTTP ni la UI.
- Cualquier estado no terminal puede pasar a otro estado no terminal. `Entregado` y `Cancelado` exigen `correction: true` para reabrirse, y el historial conserva el paso anterior.
- Al entrar a `Entregado` se sella `deliveredAt`; al corregir la salida se limpia. Cancelar no borra nada.
- `POST /api/orders/[folio]/status` valida en el borde, traduce errores de dominio a 404/409/422 y redirige al detalle con aviso o mensaje cuando el envío viene de un formulario.
- El detalle vive en `/ordenes/[folio]`: datos completos, notas internas marcadas como privadas, cotizaciones si existen, formulario de estado e historial invertido.
- La búsqueda del tablero (`/?q=`) ignora acentos, mayúsculas y separadores de placa. Se probó a mano el recorrido completo con el store en memoria.
