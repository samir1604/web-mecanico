# Marca: Taller Don Ramiro

Identidad visual mínima para la aplicación. Solo paleta, tipografía, tokens y reglas de uso. No incluye logo, voz ni componentes.

> **Nota de la prueba:** la personalidad, las referencias y las restricciones de este documento se generaron como datos de ejemplo para validar la skill `brand-design`. Confírmalos con el dueño antes de usarlos en producción.

## Decisiones

**Audiencia y contexto.** El dueño del taller (40–60 años) y sus clientes (30–60), en celular, de pie, con manos sucias y luz de día variable. La pantalla compite con el sol, el polvo y la prisa.

**Personalidad.** Confiable, directo, cercano.

**Tensión de diseño.** Cercano pero confiable: la app debe sentirse humana y de barrio sin dejar de verse seria con el dinero y las aprobaciones.

**Principio de color.** Naranja de seguridad de taller sobre neutros cálidos de papel de trabajo. El naranja señala la acción; los neutros sostienen la lectura. Nada de degradados ni efectos.

**Principio tipográfico.** Una sans de taller con números claros para el cuerpo y una condensada para títulos, como la señalización de un taller. Tamaño generoso: se lee de pie, con prisa y a plena luz.

## Paleta

| Token | Hex | Uso |
|---|---|---|
| `background` | `#FFFFFF` | Fondo principal de pantallas. |
| `surface` | `#F6F3EE` | Tarjetas, paneles y filas del tablero. |
| `surface-muted` | `#EAE5DC` | Zonas secundarias, estados vacíos y separadores de sección. |
| `border` | `#8A8274` | Bordes de campos, tarjetas y divisores con contraste suficiente. |
| `text` | `#1C1B18` | Texto principal, cifras y títulos. |
| `text-muted` | `#5A554C` | Texto secundario y metadatos; nunca para información crítica. |
| `primary` | `#B23B0B` | Acción principal: aprobar, guardar, continuar. |
| `primary-hover` | `#8F2F08` | Estado hover y pulsado del primario. |
| `primary-contrast` | `#FFFFFF` | Texto e íconos sobre `primary`. |
| `accent` | `#D06B00` | Énfasis no textual: franjas, badges y marcas de atención. |
| `success` | `#1F7A4D` | Confirmaciones y estados completados, siempre con texto o ícono. |
| `warning` | `#8A5A00` | Advertencias y cotizaciones por vencer, siempre con texto o ícono. |
| `danger` | `#B42318` | Errores y acciones destructivas. |
| `focus` | `#1C4E80` | Anillo de foco de teclado y controles activos. |

## Tipografía

**Familias.** `Barlow` para cuerpo e interfaz, `Barlow Condensed` para títulos. Ambas gratuitas, con acentos y ñ, disponibles en Google Fonts y `next/font`. Sin fallback decorativo.

| Token | Tamaño | Altura de línea | Peso | Uso |
|---|---|---|---|---|
| `xs` | 12 px / 0.75 rem | 1.4 | 500 | Etiquetas y overlines. |
| `sm` | 14 px / 0.875 rem | 1.4 | 400 | Texto secundario y metadatos. |
| `base` | 16 px / 1 rem | 1.5 | 400 | Cuerpo y campos. |
| `lg` | 20 px / 1.25 rem | 1.5 | 500 | Entradillas y subtítulos. |
| `xl` | 24 px / 1.5 rem | 1.2 | 700 | Título de sección (Condensed). |
| `2xl` | 32 px / 2 rem | 1.2 | 700 | Título de página (Condensed). |
| `3xl` | 40 px / 2.5 rem | 1.2 | 700 | Estado actual del coche (Condensed). |

## Reglas de uso

- El `primary` se reserva para la acción principal; una sola acción primaria por pantalla.
- `primary-contrast` solo se usa sobre `primary`, nunca sobre `accent` ni sobre neutros.
- El `accent` es para énfasis no textual. No se usa como color de texto ni para comunicar estados.
- `danger` solo para acciones destructivas y errores. `success` y `warning` siempre acompañados de texto o ícono.
- Ningún estado se comunica solo con color: siempre texto, ícono o ambos.
- En luz de día, la información crítica usa `text`, no `text-muted`.
- El cuerpo nunca baja de 16 px en móvil.
- Un solo `h1` por pantalla. Mayúsculas sostenidas solo en etiquetas de hasta tres palabras.
- Los títulos usan `font-family-heading`; el cuerpo usa `font-family-base`.
- No se usan degradados, sombras decorativas, transparencias ni glassmorphism.

## Contraste

Ratios calculados con la fórmula WCAG 2.x. Objetivo AA: 4.5:1 para texto normal y 3:1 para texto grande y componentes no textuales.

| Par | Foreground | Background | Ratio | Mínimo | Resultado |
|---|---|---|---|---|---|
| Texto principal | `#1C1B18` | `#FFFFFF` | 17.22 | 4.5 | Pasa |
| Texto principal en tarjeta | `#1C1B18` | `#F6F3EE` | 15.56 | 4.5 | Pasa |
| Texto secundario | `#5A554C` | `#FFFFFF` | 7.40 | 4.5 | Pasa |
| Texto secundario en tarjeta | `#5A554C` | `#F6F3EE` | 6.68 | 4.5 | Pasa |
| Texto sobre primario | `#FFFFFF` | `#B23B0B` | 5.96 | 4.5 | Pasa |
| Texto sobre primario hover | `#FFFFFF` | `#8F2F08` | 8.15 | 4.5 | Pasa |
| Primario como texto | `#B23B0B` | `#FFFFFF` | 5.96 | 4.5 | Pasa |
| Primario como texto en tarjeta | `#B23B0B` | `#F6F3EE` | 5.38 | 4.5 | Pasa |
| Peligro como texto | `#B42318` | `#F6F3EE` | 5.94 | 4.5 | Pasa |
| Éxito como texto | `#1F7A4D` | `#F6F3EE` | 4.80 | 4.5 | Pasa |
| Advertencia como texto | `#8A5A00` | `#F6F3EE` | 5.36 | 4.5 | Pasa |
| Borde sobre tarjeta | `#8A8274` | `#F6F3EE` | 3.43 | 3.0 | Pasa |
| Foco sobre fondo | `#1C4E80` | `#FFFFFF` | 8.57 | 3.0 | Pasa |
| Acento como énfasis no textual | `#D06B00` | `#F6F3EE` | 3.28 | 3.0 | Pasa |

No se usa la excepción de texto grande. Todos los pares obligatorios pasan.

## Mapeo opcional a Tailwind

```js
colors: {
  background: '#FFFFFF',
  surface: '#F6F3EE',
  'surface-muted': '#EAE5DC',
  border: '#8A8274',
  text: '#1C1B18',
  'text-muted': '#5A554C',
  primary: '#B23B0B',
  'primary-hover': '#8F2F08',
  'primary-contrast': '#FFFFFF',
  accent: '#D06B00',
  success: '#1F7A4D',
  warning: '#8A5A00',
  danger: '#B42318',
  focus: '#1C4E80',
},
fontFamily: {
  sans: ['Barlow', 'system-ui', 'sans-serif'],
  heading: ['Barlow Condensed', 'Barlow', 'system-ui', 'sans-serif'],
},
```

Los tokens viven en `tokens.json` y `tokens.css`. Conectarlos a la app es un paso de implementación aparte.
