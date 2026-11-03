# 12: Datos de demostración y reinicio

**What to build:** La primera vez que se abre la app con el almacén vacío aparecen 4–5 órdenes de ejemplo que cubren los estados principales, para que la demo no empiece en blanco. El panel ofrece "Reiniciar demo" con confirmación, y el seed se puede desactivar por variable de entorno para producción real.

**Blocked by:** 07 (aprobación con evidencia inmutable y paso a "En reparación").

**Status:** ready-for-agent

- [ ] Con el almacén vacío, el primer arranque siembra 4–5 órdenes que cubren al menos: esperando aprobación, aprobada, lista para entrega y entregada.
- [ ] Los datos sembrados respetan la máquina de estados y las reglas de cotización y evidencia.
- [ ] "Reiniciar demo" pide confirmación, borra los datos y vuelve a sembrar los ejemplos.
- [ ] Una variable de entorno desactiva el seed para instalaciones reales.
- [ ] El guion de demo se completa en un teléfono en 2–3 minutos: crear orden, compartir enlace, ver estado, agregar cotización con foto, aprobar, ver el sello, marcar listo para entrega y verlo del lado del cliente.
