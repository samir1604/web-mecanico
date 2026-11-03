# Spec: MVP Taller Don Ramiro

Status: ready-for-agent
Feature: taller-don-ramiro-mvp

## Problem Statement

Don Ramiro tiene un taller con cuatro mecánicos. Todos trabajan desde el celular, casi siempre con las manos sucias. Los clientes llaman varias veces al día para preguntar si su coche está listo, y cada llamada interrumpe el trabajo.

Cuando al revisar un coche aparece una reparación adicional, el trabajo se detiene hasta que el cliente aprueba el costo por teléfono. Eso puede tardar días y, a veces, el cliente luego niega haber aprobado la reparación. No hay forma de que el cliente consulte el estado sin llamar ni de dejar constancia verificable de lo que aprobó.

El taller ya lleva su inventario en Excel y no quiere reemplazarlo.

## Solution

Una aplicación web responsive para el dueño del taller y una página pública por orden para cada cliente.

- El dueño da de alta la orden, actualiza su estado y crea cotizaciones de reparaciones adicionales con varias partidas y una foto opcional por partida.
- Cada orden genera un enlace único que el dueño comparte por WhatsApp con un botón (`wa.me`); el cliente lo abre sin instalar nada ni crear cuenta.
- La página del cliente muestra el estado actual, el historial y la cotización pendiente, con dos acciones: Aprobar o Rechazar.
- Aprobar produce evidencia verificable: folio de aprobación, versión exacta e inmutable de la cotización, teléfono de la orden, fecha y hora, e IP. El dueño ve ese sello en su panel.
- El panel del dueño se actualiza solo y destaca las aprobaciones recientes para que se entere sin que el cliente tenga que llamar.

## User Stories

### Acceso y operación del dueño

1. Como dueño del taller, quiero entrar con una sola contraseña, para no administrar cuentas de usuario ni correos.
2. Como dueño, quiero mantener la sesión iniciada en mi teléfono, para no escribir la contraseña cada vez que abro la app.
3. Como dueño, quiero cerrar sesión explícitamente, para proteger el panel si presto el teléfono.
4. Como dueño, quiero ver un tablero con las órdenes agrupadas por estado, para saber de un vistazo qué hay en cada etapa.
5. Como dueño, quiero que el tablero se refresque solo, para no tener que recargar la página.
6. Como dueño, quiero buscar por placa o por nombre del cliente, para encontrar una orden rápido cuando el cliente llega o llama.
7. Como dueño, quiero crear una orden desde el teléfono con pocos campos, para no perder tiempo frente al cliente.
8. Como dueño, quiero que el formulario use teclados adecuados (teléfono, números) y botones grandes, para capturar datos con las manos sucias.
9. Como dueño, quiero registrar la falla reportada por el cliente, para que quede claro qué se recibió.
10. Como dueño, quiero guardar notas internas que el cliente no ve, para anotar observaciones del taller.
11. Como dueño, quiero una promesa de entrega opcional, para comprometer una fecha solo cuando tenga sentido.
12. Como dueño, quiero cambiar el estado de una orden con un toque, para mantener el tablero al día.
13. Como dueño, quiero que cada cambio de estado guarde quién lo hizo, cuándo y una nota opcional, para reconstruir la historia de la orden.
14. Como dueño, quiero cancelar una orden, para sacarla del flujo sin borrar su historial.
15. Como dueño, quiero que la orden tenga un folio legible, para referirme a ella por teléfono o en papel.
16. Como dueño, quiero abrir el detalle de una orden desde el tablero, para revisar todo lo que pasó.

### Enlace y comunicación con el cliente

17. Como dueño, quiero copiar el enlace de una orden, para enviarlo por el medio que prefiera.
18. Como dueño, quiero un botón "Enviar por WhatsApp" que abra la conversación con el cliente y el mensaje ya escrito, para ahorrar tiempo y evitar errores de dedo.
19. Como dueño, quiero ese botón disponible al crear la orden, al crear una cotización y al marcar "Listo para entrega", para avisar en los tres momentos que importan.
20. Como dueño, quiero que el enlace del cliente use un token largo e impredecible, para que nadie adivine órdenes ajenas.
21. Como dueño, quiero que un enlace deje de funcionar 30 días después de entregada la orden, para no exponer datos viejos indefinidamente.
22. Como cliente, quiero abrir un enlace y ver el estado de mi coche sin instalar nada ni registrarme, para no llamar al taller.
23. Como cliente, quiero ver el estado actual en grande, para responder "¿ya está listo?" de un vistazo.
24. Como cliente, quiero ver el historial de estados con sus fechas, para entender en qué se ha avanzado.
25. Como cliente, quiero ver los datos de mi coche y la falla que reporté, para confirmar que es mi orden.
26. Como cliente, quiero ver la cotización pendiente arriba y destacada, para no pasarla por alto.
27. Como cliente, quiero que la página se actualice sola mientras la tengo abierta, para enterarme sin recargar.
28. Como cliente, quiero un aviso claro si pierdo la conexión, para saber que estoy viendo el último estado conocido.

### Cotizaciones y partidas

29. Como dueño, quiero crear una cotización con varias partidas, para detallar exactamente qué reparaciones adicionales se cobran.
30. Como dueño, quiero que cada partida tenga concepto y precio, para que el cliente sepa qué paga.
31. Como dueño, quiero adjuntar una foto opcional por partida, para mostrar la pieza o el daño y reducir discusiones.
32. Como dueño, quiero que la foto se comprima antes de subirse, para que funcione con datos móviles lentos.
33. Como dueño, quiero ver el total de la cotización calculado automáticamente, para no sumar a mano.
34. Como dueño, quiero que los precios sean el precio final que paga el cliente, sin cálculo de IVA, porque el MVP no factura.
35. Como dueño, quiero editar una cotización pendiente, para corregir un precio o quitar una partida antes de que el cliente responda.
36. Como dueño, quiero que editar una cotización pendiente cree una versión nueva y marque la anterior como reemplazada, para que el cliente nunca vea dos cotizaciones contradictorias.
37. Como dueño, quiero que una cotización ya aprobada no se pueda editar, para que la evidencia siga siendo válida.
38. Como dueño, quiero emitir una cotización nueva sobre una orden con cotización aprobada, para cubrir un hallazgo posterior, sabiendo que requerirá otra aprobación.
39. Como dueño, quiero que toda cotización venza a los 7 días, para que una cotización vieja no se apruebe por accidente.
40. Como dueño, quiero que las cotizaciones vencidas se marquen como tales al consultarlas, sin necesidad de un proceso programado.
41. Como sistema, quiero mantener una sola cotización vigente por orden, para que el estado de aprobación sea inequívoco.

### Aprobación y rechazo

42. Como cliente, quiero aprobar la cotización con un solo botón, para resolverlo rápido aunque tenga las manos sucias o prisa.
43. Como cliente, quiero ver el desglose completo y el total antes de aprobar, para saber exactamente qué acepto.
44. Como cliente, quiero rechazar la cotización y opcionalmente explicar por qué, para que el taller sepa qué hacer.
45. Como cliente, quiero que al aprobar se me muestre un comprobante con folio y fecha, para tener constancia de lo que acepté.
46. Como dueño, quiero que la aprobación guarde automáticamente el teléfono de la orden, la fecha y hora, la IP y la versión exacta de la cotización, para tener evidencia sin pedirle nada al cliente.
47. Como dueño, quiero que la evidencia incluya una copia inmutable de las partidas y precios aprobados, para que cambios posteriores no alteren lo que el cliente aceptó.
48. Como dueño, quiero que aprobar mueva la orden a "En reparación" automáticamente, para no depender de un paso manual.
49. Como dueño, quiero que crear una cotización mueva la orden a "Esperando aprobación" automáticamente, para que el tablero refleje la realidad.
50. Como dueño, quiero que rechazar devuelva la orden a "En diagnóstico" con una nota automática del motivo, para retomar el trabajo con contexto.
51. Como dueño, quiero que un intento de aprobar una cotización ya reemplazada o vencida falle con un mensaje claro, para no registrar evidencia inválida.

### Notificaciones y seguimiento

52. Como dueño, quiero que las aprobaciones recientes aparezcan destacadas en el tablero con un indicador "Aprobada · hace X", para enterarme sin que el cliente llame.
53. Como dueño, quiero un contador de aprobaciones pendientes de revisar, para no dejarlas pasar.
54. Como dueño, quiero que el indicador desaparezca cuando abro la orden, para distinguir lo nuevo de lo ya visto.

### Estados e historial

55. Como dueño, quiero usar exactamente los estados Recibido, En diagnóstico, Esperando aprobación, En reparación, Listo para entrega, Entregado, Cancelado y Rechazado, para que todo el taller hable el mismo idioma.
56. Como dueño, quiero que "esperando repuesto" se maneje como nota o subestado libre, para no inflar la lista de estados.
57. Como cliente, quiero ver los estados en lenguaje claro, para entender qué significan sin preguntar.
58. Como dueño, quiero que el estado "Entregado" sea terminal salvo corrección manual, para cerrar la orden.

### Demo y operación

59. Como dueño, quiero encontrar órdenes de ejemplo la primera vez que abro la app, para entender el producto de inmediato.
60. Como dueño, quiero reiniciar los datos de demo desde el panel, para volver a presentar el flujo sin limpiar la base a mano.
61. Como dueño, quiero que el reinicio pida confirmación, para no borrar datos reales por accidente.
62. Como operador de la demo, quiero que la app funcione en un teléfono de gama baja con datos móviles, para demostrarla en el taller real.

## Implementation Decisions

### Stack y ejecución

- Next.js con App Router, React y TypeScript. Despliegue en Vercel.
- Interfaz responsive mobile-first; **no PWA**, no service worker, sin instalación.
- Sin backend separado: las rutas HTTP de Next.js actúan como API.
- Idioma español de México, moneda USD y zona horaria `America/Mexico_City` para toda presentación. Se almacena en UTC.

### Módulos

- **`workshop` (dominio)**: módulo TypeScript puro, sin I/O, única puerta de entrada a las mutaciones y consultas. Operaciones: crear orden, obtener orden por folio, obtener orden por token, listar órdenes, cambiar estado, agregar cotización, editar cotización pendiente, aprobar cotización, rechazar cotización, marcar visto, reiniciar demo.
- **`store` (puerto)**: interfaz inyectada con lectura/escritura de la orden completa y listado. Dos adaptadores: Upstash Redis en producción y un fake en memoria para tests.
- **`reloj` (puerto)**: reloj inyectable para poder probar vencimientos de forma determinista.
- **`http` (adaptadores)**: route handlers delgados que autentican, validan payloads, llaman a `workshop` y traducen resultados a códigos HTTP.
- **`ui`**: páginas del panel del dueño y de la orden del cliente. No contiene reglas de negocio.

### Modelo de datos

- Una **orden** es un documento JSON autocontenido: folio, token, datos del cliente, vehículo, falla reportada, notas internas, promesa de entrega, estado, historial de estados, cotizaciones, aprobaciones, marca de "visto por el dueño", fechas de creación/entrega.
- Las **cotizaciones** viven dentro de la orden, con `version`, `status` (`pendiente`, `aprobada`, `rechazada`, `reemplazada`, `vencida`), partidas, total, fechas y vigencia de 7 días.
- Cada **partida** tiene concepto, precio y foto opcional.
- La **aprobación** es un registro inmutable dentro de la orden: folio de aprobación, `quoteVersion`, copia congelada de las partidas y total aprobados, teléfono, fecha/hora, IP y agente de usuario. No se recalcula nunca a partir de la cotización actual.
- Los precios se guardan como enteros en centavos de USD para evitar errores de punto flotante; se presentan como `$1,234.00 USD`.
- El folio de la orden es legible y secuencial (por ejemplo `RM-0001`). El token del enlace es independiente, aleatorio de 32 bytes en base64url, y se indexa para resolver la orden.
- Solo hay una cotización vigente por orden. Crear o editar una cotización pendiente crea una nueva versión y marca la anterior como `reemplazada`. Una cotización `aprobada` es inmutable.
- El vencimiento se evalúa de forma perezosa al leer o mutar la orden; no requiere cron.

### Máquina de estados

- Estados: `Recibido`, `En diagnóstico`, `Esperando aprobación`, `En reparación`, `Listo para entrega`, `Entregado`, `Cancelado`, `Rechazado`.
- Crear cotización vigente: → `Esperando aprobación`.
- Aprobar: → `En reparación`.
- Rechazar: → `En diagnóstico`, con nota automática del motivo.
- Cambios manuales permitidos al dueño entre estados no terminales.
- `Entregado` y `Cancelado` son terminales salvo corrección manual explícita.
- Toda transición registra autor (dueño), fecha/hora y nota opcional en el historial.

### Evidencia de aprobación

- El cliente solo presiona **Aprobar**. No escribe su nombre, no crea cuenta y no firma.
- La evidencia se compone de datos que el sistema ya tiene más los de la petición: teléfono de la orden, versión de la cotización, copia congelada del contenido, fecha/hora del servidor, IP y agente de usuario.
- Se genera un folio de aprobación corto y legible que se muestra al cliente y al dueño.
- Aprobar una cotización `reemplazada`, `vencida`, `rechazada` o ya `aprobada` devuelve un error de dominio explícito y no crea evidencia.

### Persistencia y concurrencia

- Upstash Redis mediante la integración de Vercel. Una clave por orden, más un índice de folios y un índice de tokens.
- Se descarta la base "en memoria": en Vercel las funciones no comparten estado y se reinician en cada despliegue.
- Cada escritura relee, aplica la operación de dominio y guarda con verificación de revisión. Si la revisión cambió, la operación falla con "la orden cambió, recarga" en lugar de sobrescribir.
- Las fotos se comprimen en el navegador antes de subir (lado máximo ~1200 px, JPEG) y se guardan como base64 dentro del documento de la orden, con un límite de ~200 KB por foto. Si excede, se rechaza con un mensaje claro.

### Autenticación y enlaces

- El dueño entra con una contraseña única tomada de variable de entorno. La sesión es una cookie firmada con HMAC, `httpOnly`, `secure` y `sameSite=lax`.
- No hay cuentas de mecánicos: todas las acciones del panel se atribuyen al dueño.
- El cliente no se autentica: el token del enlace es la credencial. Los tokens no son enumerables y no se listan en ninguna respuesta.
- El enlace del cliente sigue activo hasta 30 días después de que la orden pasa a `Entregado`; después responde "enlace vencido" sin revelar datos.

### Interfaz

- Panel del dueño: tablero agrupado por estado, búsqueda por placa/nombre, botón de nueva orden, detalle de orden, cambio de estado, creación/edición de cotización, reinicio de demo.
- Página del cliente: estado actual destacado, historial, datos del coche, cotización pendiente con Aprobar/Rechazar, comprobante tras aprobar.
- Refresco automático cada 15 segundos en ambas superficies, con reintento y respaldo exponencial ante fallos.
- Se muestra un aviso de "sin conexión / mostrando último estado conocido" cuando una actualización falla.
- Botones de al menos 44 px, alto contraste y confirmaciones solo para acciones destructivas.

### Integración con WhatsApp

- Sin API: se usan enlaces `wa.me` con el teléfono normalizado a formato mexicano (+52, sin el "1" de móvil) y un mensaje prellenado que incluye folio y enlace.
- Tres disparadores: orden creada, cotización creada, orden marcada "Listo para entrega".

### Datos de demostración

- Al primer arranque, si el almacén está vacío, se siembran 4–5 órdenes cubriendo: esperando aprobación, aprobada, lista para entrega y entregada.
- El panel ofrece "Reiniciar demo" con confirmación; vuelve a sembrar los datos de ejemplo.
- En producción real, el seed se desactiva por variable de entorno.

### Errores y validación

- Validación de payloads en el borde HTTP; el dominio asume datos válidos pero verifica invariantes (una cotización vigente, transiciones permitidas, vigencia).
- Errores de dominio devuelven mensajes en español aptos para mostrarse al usuario.
- Los fallos de red en el cliente no bloquean la lectura: se conserva el último estado conocido y se reintenta.

## Testing Decisions

Un buen test verifica **comportamiento observable en el seam**, no detalles internos: dado un estado y una operación, qué estado resultante, qué historial y qué evidencia se producen. Nada de aserciones sobre estructuras privadas ni sobre cómo se guarda el documento.

### Seam principal: `workshop`

- Se prueba el módulo de dominio con el adaptador `store` en memoria y el `reloj` inyectado.
- Casos clave:
  - Crear orden asigna folio y token únicos; el token resuelve la orden y el folio no.
  - Crear cotización pasa la orden a "Esperando aprobación" y deja una sola cotización vigente.
  - Editar una cotización pendiente crea versión nueva y marca la anterior como reemplazada.
  - Aprobar congela partidas y total; una edición posterior no altera la evidencia.
  - Aprobar una versión reemplazada, vencida o ya aprobada falla y no registra evidencia.
  - Aprobar mueve a "En reparación"; rechazar vuelve a "En diagnóstico" con nota.
  - El vencimiento a 7 días se evalúa con el reloj inyectado, sin cron.
  - El enlace vence 30 días después de "Entregado".
  - Toda transición deja rastro con autor, fecha y nota.
  - La verificación de revisión impide sobrescribir una orden modificada por otra operación.

### Segundo seam: HTTP

- Tests de contrato sobre los route handlers con el servicio real y store falso.
- Casos: login correcto/incorrecto, cookie requerida en el panel, token válido/ inválido/vencido, payload inválido, aprobación duplicada, y códigos de respuesta correctos.
- No se prueba la UI con tests automatizados en el MVP; el guion de demo se verifica a mano.

### Prior art

- No existe código previo en el repo; estos tests establecen el patrón. Se prefiere un solo seam de dominio fuerte antes que muchos tests de componentes.

## Out of Scope

- Inventario (se mantiene en Excel).
- Pagos, cobros o pasarelas de pago.
- Facturación, IVA, CFDIs o cualquier cálculo fiscal.
- Citas, agenda o recordatorios programados.
- Chat entre cliente y taller.
- Reportes, gráficas, exportaciones o contabilidad.
- Multi-taller: registro de negocios, aislamiento por suscripción o cobro a terceros.
- App nativa, PWA, notificaciones push, correo o SMS.
- WhatsApp Business API, plantillas de Meta o mensajes automáticos.
- Modo offline completo con cola de sincronización.
- Internacionalización más allá de español de México.

## Further Notes

- **Guion de aceptación (2–3 minutos)**: crear orden → compartir enlace → el cliente ve "En diagnóstico" → el dueño agrega cotización con foto → el cliente aprueba → el dueño ve sello con folio, hora y teléfono → cambiar a "Listo para entrega" → el cliente lo ve sin llamar.
- **Límite de la evidencia**: el registro reduce fuertemente el "yo no aprobé eso", pero no es una firma electrónica certificada. Si más adelante se necesita valor probatorio formal, habría que evaluar firma electrónica avanzada y conservación de logs.
- **WhatsApp**: la integración manual evita verificación de negocio, plantillas y costos por mensaje. La API se puede añadir después sin cambiar el modelo de evidencia.
- **Operación**: se necesitan variables de entorno para la contraseña del dueño, el secreto de sesión, las credenciales de Upstash y el interruptor de seed. El plan gratuito de Upstash basta para la demo.
- **Privacidad**: el enlace es la única credencial del cliente; conviene no compartirlo en grupos y mantener la caducidad de 30 días después de la entrega.
