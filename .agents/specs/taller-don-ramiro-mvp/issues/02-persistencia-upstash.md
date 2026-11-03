# 02: Persistencia en Upstash y despliegue en Vercel

**What to build:** El mismo recorrido del ticket 01, pero con los datos viviendo en Upstash Redis y la app desplegada en Vercel. Una orden creada desde un teléfono se ve desde otro y sobrevive a un redespliegue. Las escrituras concurrentes no se pisan.

**Blocked by:** 01 (esqueleto caminante con store en memoria).

**Status:** in-progress

- [x] El adaptador de Upstash implementa el mismo puerto de almacenamiento que el store en memoria, sin cambiar el módulo de dominio.
- [ ] Una orden creada en un dispositivo aparece en otro y persiste después de un redespliegue.
- [x] Una escritura sobre una revisión desactualizada falla con un mensaje claro del tipo "la orden cambió, recarga" y no sobrescribe datos.
- [x] Los tests de dominio siguen corriendo contra el store en memoria, sin depender de Upstash.
- [ ] Las variables de entorno necesarias (contraseña del dueño, secreto de sesión, credenciales de Upstash) están documentadas y la demo es accesible desde un teléfono.

## Notas de implementación

- `src/store/redis-store.ts` guarda cada orden como documento JSON, un índice de tokens y un set de folios.
- `create` usa `SET NX`; `save` usa un script Lua que compara `rev` y escribe en una sola operación.
- La secuencia de folios es `INCR` sobre `ordenes:secuencia`.
- Verificado en local: una orden creada por HTTP siguió apareciendo después de detener y volver a arrancar el servidor de desarrollo.
- Pendiente: desplegar en Vercel y comprobar desde otro dispositivo.
