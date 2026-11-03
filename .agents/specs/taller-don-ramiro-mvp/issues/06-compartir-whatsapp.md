# 06: Compartir por WhatsApp y copiar enlace

**What to build:** El dueño puede copiar el enlace de una orden y abrir WhatsApp con el mensaje ya escrito y el teléfono del cliente. El botón aparece al crear la orden, al crear una cotización y al marcar "Listo para entrega". No se envía nada automáticamente ni se usa la API de WhatsApp.

**Blocked by:** 05 (cotización con partidas y paso automático a "Esperando aprobación").

**Status:** ready-for-agent

- [ ] Copiar enlace copia exactamente el enlace público de esa orden.
- [ ] El botón de WhatsApp abre `wa.me` con el número normalizado a +52 (sin el "1" de móvil) y un mensaje prellenado con folio y enlace.
- [ ] El botón aparece en los tres momentos: orden creada, cotización creada y orden marcada "Listo para entrega".
- [ ] Un teléfono con formato inválido deshabilita el botón y explica por qué, sin romper el flujo.
- [ ] Ningún mensaje se envía desde el servidor; no hay integración con la API de WhatsApp.
