# 01: Esqueleto caminante con store en memoria

**What to build:** La app arranca en local sin servicios externos. El dueño entra con una contraseña única, crea una orden desde el teléfono y la ve en un tablero agrupado por estado. Cada orden nace con folio legible y token de enlace independiente. Queda montado el seam de dominio con un store en memoria y un reloj inyectable, además de los contratos HTTP básicos.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] Con la contraseña correcta se abre el panel; con la incorrecta se rechaza. La sesión vive en una cookie firmada, httpOnly y secure, y el panel exige sesión.
- [x] Crear una orden captura cliente, teléfono, marca, modelo, placa, falla reportada, fecha de ingreso, promesa opcional y notas internas.
- [x] Toda orden recibe un folio legible y secuencial, y un token aleatorio de 32 bytes distinto del folio.
- [x] El tablero muestra las órdenes agrupadas por estado y funciona en un viewport de teléfono con controles táctiles grandes.
- [x] El dominio se prueba a través de su interfaz pública con store en memoria y reloj falso; los contratos HTTP cubren login correcto/incorrecto y acceso sin sesión.
