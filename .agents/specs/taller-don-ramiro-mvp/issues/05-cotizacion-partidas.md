# 05: Cotización con partidas y paso automático a "Esperando aprobación"

**What to build:** El dueño crea una cotización de reparación adicional con varias partidas (concepto y precio), ve el total calculado solo, y la orden pasa automáticamente a "Esperando aprobación". El cliente ve esa cotización pendiente destacada, con su desglose y total, en su enlace público.

**Blocked by:** 04 (página pública del cliente y caducidad del enlace).

**Status:** ready-for-agent

- [ ] Una cotización admite una o más partidas y el total es la suma exacta de los precios, guardados en centavos.
- [ ] El total se presenta con formato de moneda USD, por ejemplo `$1,234.00 USD`.
- [ ] Crear una cotización vigente mueve la orden a "Esperando aprobación" automáticamente.
- [ ] Solo existe una cotización vigente por orden.
- [ ] La página del cliente muestra la cotización pendiente arriba y destacada, con partidas y total.
- [ ] Los tests de dominio cubren suma de partidas, transición automática y unicidad de la cotización vigente.
