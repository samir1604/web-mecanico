# 07: Aprobación con evidencia inmutable y paso a "En reparación"

**What to build:** El cliente aprueba la cotización con un solo botón y recibe un comprobante con folio y fecha. El sistema guarda evidencia verificable: teléfono de la orden, fecha/hora del servidor, IP, agente de usuario y una copia congelada de las partidas y el total aprobados. El dueño ve ese sello en el detalle y la orden pasa automáticamente a "En reparación".

**Blocked by:** 05 (cotización con partidas y paso automático a "Esperando aprobación").

**Status:** ready-for-agent

- [ ] Aprobar registra un folio de aprobación, la versión exacta de la cotización, la copia congelada de partidas y total, el teléfono de la orden, la fecha/hora del servidor, la IP y el agente de usuario.
- [ ] Una modificación posterior de la cotización no altera la evidencia ya registrada.
- [ ] El cliente ve un comprobante con folio y fecha después de aprobar.
- [ ] El dueño ve el sello de aprobación en el detalle de la orden.
- [ ] Aprobar mueve la orden a "En reparación" automáticamente.
- [ ] Los tests de dominio verifican la evidencia congelada y que una edición posterior no la modifica.
