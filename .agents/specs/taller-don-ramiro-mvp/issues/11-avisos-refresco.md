# 11: Avisos de aprobación y refresco automático

**What to build:** Cuando el cliente aprueba, el dueño se entera sin que nadie llame: el tablero destaca la orden con "Aprobada · hace X" y muestra un contador de aprobaciones sin revisar, que se limpia al abrir la orden. Ambas superficies se refrescan solas cada 15 segundos, con reintentos y un aviso claro cuando se pierde la conexión.

**Blocked by:** 07 (aprobación con evidencia inmutable y paso a "En reparación").

**Status:** ready-for-agent

- [ ] El tablero marca las aprobaciones recientes con "Aprobada · hace X" y un contador de pendientes de revisar.
- [ ] Abrir el detalle de una orden limpia su indicador de no revisada.
- [ ] El panel del dueño y la página del cliente se actualizan cada 15 segundos sin recargar la página completa.
- [ ] Un fallo de red muestra "sin conexión / mostrando el último estado conocido" y reintenta con respaldo exponencial.
- [ ] El refresco automático no borra lo que el usuario está escribiendo en un formulario.
