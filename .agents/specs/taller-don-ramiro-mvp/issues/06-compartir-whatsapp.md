# 06: Compartir por WhatsApp y copiar enlace

**What to build:** El dueño puede copiar el enlace de una orden y abrir WhatsApp con el mensaje ya escrito y el teléfono del cliente. El botón aparece al crear la orden, al crear una cotización y al marcar "Listo para entrega". No se envía nada automáticamente ni se usa la API de WhatsApp.

**Blocked by:** 05 (cotización con partidas y paso automático a "Esperando aprobación").

**Status:** done

- [x] Copiar enlace copia exactamente el enlace público de esa orden.
- [x] El botón de WhatsApp abre `wa.me` con el número normalizado a +52 (sin el "1" de móvil) y un mensaje prellenado con folio y enlace.
- [x] El botón aparece en los tres momentos: orden creada, cotización creada y orden marcada "Listo para entrega".
- [x] Un teléfono con formato inválido deshabilita el botón y explica por qué, sin romper el flujo.
- [x] Ningún mensaje se envía desde el servidor; no hay integración con la API de WhatsApp.

## Notas de implementación

- El módulo puro `src/workshop/whatsapp.ts` normaliza el teléfono y arma la URL de `wa.me`. Acepta 10 dígitos locales, `+52` con o sin el `1` de móvil y los prefijos antiguos `044`/`045`; cualquier otra forma devuelve `null`.
- `ShareOrder` (`src/app/_components/share-order.tsx`) calcula el enlace con el origen actual del navegador, copia con `navigator.clipboard` (con respaldo a `execCommand`) y abre WhatsApp en otra pestaña. Todo ocurre en el cliente; no hay endpoint ni llamada saliente.
- La tarjeta de compartir aparece siempre en el detalle de la orden, así cubre los tres disparadores y permite reenviar el enlace después. El tablero también la muestra justo después de crear una orden.
- Si el teléfono no se puede normalizar, el botón de WhatsApp queda deshabilitado y se explica el motivo; copiar el enlace sigue disponible.
- El mensaje prellenado incluye el nombre del cliente, el folio y el enlace público.
