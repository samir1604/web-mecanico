# 07: Aprobación con evidencia inmutable y paso a "En reparación"

**What to build:** El cliente aprueba la cotización con un solo botón y recibe un comprobante con folio y fecha. El sistema guarda evidencia verificable: teléfono de la orden, fecha/hora del servidor, IP, agente de usuario y una copia congelada de las partidas y el total aprobados. El dueño ve ese sello en el detalle y la orden pasa automáticamente a "En reparación".

**Blocked by:** 05 (cotización con partidas y paso automático a "Esperando aprobación").

**Status:** done

- [x] Aprobar registra un folio de aprobación, la versión exacta de la cotización, la copia congelada de partidas y total, el teléfono de la orden, la fecha/hora del servidor, la IP y el agente de usuario.
- [x] Una modificación posterior de la cotización no altera la evidencia ya registrada.
- [x] El cliente ve un comprobante con folio y fecha después de aprobar.
- [x] El dueño ve el sello de aprobación en el detalle de la orden.
- [x] Aprobar mueve la orden a "En reparación" automáticamente.
- [x] Los tests de dominio verifican la evidencia congelada y que una edición posterior no la modifica.

## Notas de implementación

- `approveQuote(token, version, evidencia)` en el dominio usa el token como credencial, exige la versión exacta que el cliente está viendo y devuelve la aprobación junto con la orden actualizada. Si la versión no coincide, la cotización ya fue aprobada, fue reemplazada o venció, falla antes de escribir cualquier evidencia.
- La aprobación congela `items` y `totalCents` con una copia profunda. Editar o emitir una cotización posterior nunca toca ese registro; cada aprobación nueva recibe un folio corto propio (`AP-0001`, `AP-0002`, …) dentro de la orden.
- `POST /api/public/orders/[token]/approve` no exige sesión: el token es la única credencial. Toma IP y agente de usuario de las cabeceras de la petición (`x-forwarded-for`, `user-agent`) y nunca del cuerpo enviado por el navegador. Responde `201` con el comprobante público en JSON o redirige a `/orden/<token>?aprobada=1`.
- La proyección pública incluye `approval` con folio, versión, partidas congeladas, total y fecha. Excluye teléfono, IP y agente de usuario, que solo se muestran en el panel del dueño.
- El detalle del dueño agrega la sección «Sello de aprobación» con el folio, la fecha, el teléfono de la orden, IP, agente de usuario y la copia congelada de partidas y total.
- Aprobar una cotización vencida, reemplazada, rechazada o ya aprobada ya devuelve un error de dominio; el ticket 08 completa el rechazo, el vencimiento visible para el cliente y los tests exactos a los 7 días.
