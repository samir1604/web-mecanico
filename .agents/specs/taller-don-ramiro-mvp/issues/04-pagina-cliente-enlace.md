# 04: Página pública del cliente y caducidad del enlace

**What to build:** El cliente abre el enlace de su orden sin iniciar sesión y ve el estado actual en grande, el historial, los datos del coche y la falla reportada. No ve notas internas ni otras órdenes. El enlace deja de funcionar 30 días después de que la orden pasa a Entregado.

**Blocked by:** 03 (detalle, cambios de estado, historial y búsqueda).

**Status:** ready-for-agent

- [ ] El token abre la página pública sin login y muestra solo el estado actual, el historial, el vehículo y la falla reportada.
- [ ] Las notas internas y cualquier otra orden nunca aparecen en la página pública.
- [ ] Un token desconocido o inválido responde "enlace no válido" sin revelar datos ni permitir enumeración.
- [ ] Una orden entregada muestra "enlace vencido" a los 30 días, verificado con el reloj inyectado.
- [ ] Los contratos HTTP cubren token válido, inválido y vencido.
