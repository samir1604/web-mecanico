# Taller Don Ramiro — MVP

Aplicación web para que un taller mecánico comparta el estado de cada orden con su cliente mediante un enlace, sin llamadas telefónicas y con aprobación de cotizaciones verificable.

> **Estado:** el panel del dueño está desplegado en Vercel con persistencia real en Upstash Redis. Ya incluye creación de órdenes, tablero con búsqueda, detalle, cambios de estado, historial y página pública del cliente por enlace. Cotizaciones, compartir por WhatsApp y evidencia de aprobación siguen pendientes.

**Demo:** <https://web-mecanico.vercel.app> — el acceso es con la contraseña única del dueño; no se publica aquí.

## El problema

Don Ramiro tiene un taller con cuatro mecánicos. Todos trabajan desde el celular, casi siempre con las manos sucias. Los clientes llaman varias veces al día para preguntar si su coche está listo, y cada llamada interrumpe el trabajo.

Cuando aparece una reparación adicional, el trabajo se detiene hasta que el cliente aprueba el costo por teléfono. Eso puede tardar días y, a veces, el cliente luego niega haber aprobado la reparación.

## La solución

- El dueño da de alta la orden, actualiza su estado y crea cotizaciones con varias partidas y una foto opcional por partida.
- Cada orden genera un enlace único que se comparte por WhatsApp. El cliente lo abre sin instalar nada ni crear cuenta.
- La página del cliente muestra el estado actual, el historial y la cotización pendiente, con dos acciones: **Aprobar** o **Rechazar**.
- Aprobar produce evidencia verificable: folio, versión exacta e inmutable de la cotización, teléfono de la orden, fecha, hora e IP.
- El panel del dueño se actualiza solo y destaca las aprobaciones recientes.

## Flujo de aceptación

1. El dueño crea la orden y comparte el enlace.
2. El cliente ve el estado y la falla reportada.
3. El dueño agrega una cotización con foto.
4. El cliente aprueba y recibe un comprobante.
5. El dueño ve el sello de aprobación y cambia el estado a «Listo para entrega».
6. El cliente lo ve sin llamar.

## Stack decidido

| Decisión | Elección |
| --- | --- |
| Framework | Next.js con App Router, React y TypeScript |
| Despliegue | Vercel |
| Persistencia | Upstash Redis (una llave por orden + índices) |
| Interfaz | Web responsive mobile-first; sin PWA ni service worker |
| Idioma y moneda | Español de México, USD, zona `America/Mexico_City` |
| Pruebas | Vitest sobre el dominio y los contratos HTTP |

La arquitectura separa un módulo de dominio puro (`workshop`) de los adaptadores de persistencia, HTTP y UI. Las reglas de negocio se prueban sin Redis ni servidor.

## Despliegue

El repositorio está conectado a Vercel por GitHub: cada push a `main` despliega a <https://web-mecanico.vercel.app>. La URL con hash (`web-mecanico-<hash>-...vercel.app`) es de un deployment concreto y no recibe actualizaciones; usa siempre el dominio estable.

Variables necesarias en Vercel (Production y Preview):

| Variable | Valor |
| --- | --- |
| `OWNER_PASSWORD` | contraseña única del dueño, larga y aleatoria en producción |
| `SESSION_SECRET` | secreto HMAC (genera uno con el comando de `.env.example`) |
| `UPSTASH_REDIS_REST_URL` | URL REST del Redis de Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | token REST del mismo Redis |

Los cambios de variables solo aplican a deployments nuevos: después de editarlas hay que redesplegar. Pega los valores sin comillas; aun así, la app tolera comillas y espacios accidentales.

`GET /api/health` responde sin exponer secretos: qué variables existen, el commit desplegado y si Redis contesta (`"redis":"ok"`). Es la forma más rápida de diagnosticar un despliegue.

## Qué hay en este repositorio

- [`spec.md`](.agents/specs/taller-don-ramiro-mvp/spec.md) — especificación completa: historias, modelo de datos, máquina de estados, decisiones de implementación y criterios de prueba.
- [`issues/`](.agents/specs/taller-don-ramiro-mvp/issues/) — desglose del trabajo en tickets.
- [`docs/brand/`](docs/brand/) — identidad visual: paleta, tipografía y tokens.
- [`skills/`](skills/) — configuración local de skills del agente.

## Fuera de alcance

Inventario (se mantiene en Excel), pagos y facturación, citas, chat, reportes, multi-taller, app nativa, notificaciones push, WhatsApp Business API y modo offline completo.

## Límite conocido

La evidencia de aprobación reduce fuertemente el «yo no aprobé eso», pero no es una firma electrónica certificada. Si más adelante se requiere valor probatorio formal, habría que evaluar firma electrónica avanzada y conservación de logs.
