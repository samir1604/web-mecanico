# 02: Persistencia en Upstash y despliegue en Vercel

**What to build:** El mismo recorrido del ticket 01, pero con los datos viviendo en Upstash Redis y la app desplegada en Vercel. Una orden creada desde un teléfono se ve desde otro y sobrevive a un redespliegue. Las escrituras concurrentes no se pisan.

**Blocked by:** 01 (esqueleto caminante con store en memoria).

**Status:** ready-for-agent

- [ ] El adaptador de Upstash implementa el mismo puerto de almacenamiento que el store en memoria, sin cambiar el módulo de dominio.
- [ ] Una orden creada en un dispositivo aparece en otro y persiste después de un redespliegue.
- [ ] Una escritura sobre una revisión desactualizada falla con un mensaje claro del tipo "la orden cambió, recarga" y no sobrescribe datos.
- [ ] Los tests de dominio siguen corriendo contra el store en memoria, sin depender de Upstash.
- [ ] Las variables de entorno necesarias (contraseña del dueño, secreto de sesión, credenciales de Upstash) están documentadas y la demo es accesible desde un teléfono.
