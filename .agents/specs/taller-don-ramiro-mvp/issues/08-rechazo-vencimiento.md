# 08: Rechazo y vencimiento de cotizaciones

**What to build:** El cliente puede rechazar la cotización y explicar opcionalmente por qué; la orden vuelve a "En diagnóstico" con una nota automática. Toda cotización vence a los 7 días aunque nadie la abra. Aprobar una cotización vencida, rechazada o ya aprobada falla con un mensaje claro y no genera evidencia.

**Blocked by:** 07 (aprobación con evidencia inmutable y paso a "En reparación").

**Status:** ready-for-agent

- [ ] Rechazar registra autor, fecha/hora y motivo opcional, y devuelve la orden a "En diagnóstico" con una nota automática.
- [ ] Una cotización pendiente pasa a "Vencida" a los 7 días, evaluado de forma perezosa con el reloj inyectado y sin cron.
- [ ] Aprobar una cotización vencida, rechazada o ya aprobada devuelve un error de dominio comprensible y no crea evidencia.
- [ ] El cliente ve con claridad el estado rechazado o vencido de su cotización.
- [ ] Los tests de dominio cubren rechazo, vencimiento exacto a los 7 días y los tres intentos de aprobación inválidos.
