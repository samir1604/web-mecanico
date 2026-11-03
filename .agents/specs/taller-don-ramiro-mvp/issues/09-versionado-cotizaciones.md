# 09: Edición y versionado de cotizaciones

**What to build:** El dueño puede corregir una cotización pendiente: al guardar se crea una versión nueva y la anterior queda como "Reemplazada", de modo que el cliente nunca ve dos cotizaciones contradictorias. Una cotización aprobada no se edita; para cobrar algo adicional se emite una nueva que exige otra aprobación.

**Blocked by:** 07 (aprobación con evidencia inmutable y paso a "En reparación").

**Status:** ready-for-agent

- [ ] Editar una cotización pendiente crea una versión nueva con número incrementado y marca la anterior como "Reemplazada" en el historial.
- [ ] La página del cliente muestra solo la versión vigente.
- [ ] Una cotización aprobada no se puede editar.
- [ ] Emitir una cotización nueva sobre una orden con cotización aprobada la deja pendiente y exige una nueva aprobación.
- [ ] Aprobar una versión reemplazada falla con un mensaje claro y no registra evidencia.
- [ ] Los tests de dominio cubren la cadena de versiones, el reemplazo y la inmutabilidad de lo aprobado.
