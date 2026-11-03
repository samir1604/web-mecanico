# 10: Fotos por partida

**What to build:** El dueño adjunta una foto opcional por partida de la cotización, tomada con la cámara o elegida del teléfono. La imagen se comprime antes de subirse y el cliente la ve junto a la partida. Si la cotización se aprueba, la foto queda incluida en la evidencia congelada.

**Blocked by:** 07 (aprobación con evidencia inmutable y paso a "En reparación").

**Status:** ready-for-agent

- [ ] Cada partida admite una foto opcional tomada desde la cámara o el archivo del teléfono.
- [ ] La imagen se comprime en el navegador (lado máximo aproximado de 1200 px, JPEG) antes de subirse.
- [ ] Una foto que excede el límite de tamaño (~200 KB después de comprimir) se rechaza con un mensaje claro y no rompe la captura de la cotización.
- [ ] El cliente ve la foto junto a su partida en la cotización pendiente.
- [ ] La evidencia de una aprobación conserva la foto de forma congelada, igual que los precios.
- [ ] Los tests de dominio verifican que la foto forma parte de la copia congelada y que su ausencia es válida.
