# 03: Detalle, cambios de estado, historial y búsqueda

**What to build:** El dueño abre una orden, cambia su estado con una nota opcional y ve el historial completo con autor, fecha y nota. Las transiciones respetan la máquina de estados y Entregado/Cancelado son terminales salvo corrección explícita. Desde el tablero puede buscar por placa o por nombre del cliente.

**Blocked by:** 01 (esqueleto caminante con store en memoria).

**Status:** ready-for-agent

- [ ] El detalle muestra todos los datos de la orden, incluidas las notas internas, y estas nunca aparecen en superficies públicas.
- [ ] Cambiar de estado registra autor (dueño), fecha/hora y nota opcional en el historial.
- [ ] Solo se permiten las transiciones de la máquina de estados; Entregado y Cancelado quedan terminales salvo corrección manual explícita.
- [ ] Cancelar una orden la saca del flujo sin borrar su historial.
- [ ] La búsqueda filtra el tablero por placa o nombre de cliente.
- [ ] Los tests de dominio cubren transiciones válidas e inválidas, registro de historial y reglas terminales.
