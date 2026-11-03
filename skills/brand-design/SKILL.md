---
name: brand-design
description: "Diseña la identidad visual mínima de una aplicación: paleta, tipografía, tokens y reglas de uso. Úsala cuando pidan definir colores, fuentes o tokens de marca para una app."
disable-model-invocation: true
---

# Brand Design

Produce una identidad visual mínima y aplicable para una app: **paleta, tipografía, tokens y reglas de uso**. No diseña logo, no define voz ni brief narrativo, no construye componentes.

## Antes de empezar

- Busca el spec de la app (por ejemplo bajo `.agents/specs/` o `docs/`) y léelo.
- Revisa si ya existe marca: colores, fuentes o tokens en uso. Trátalos como restricción, no los reemplaces sin decirlo.
- Si no hay spec ni marca previa, apóyate solo en la entrevista.

## Entrevista

Haz estas cinco preguntas en una sola tanda. No inventes ninguna respuesta: si falta una, vuelve a preguntar.

1. ¿Qué es la app y quién la usa? (contexto, edad, dispositivo, condiciones de uso)
2. ¿Qué tres adjetivos deben describir su personalidad?
3. ¿Qué referencias visuales te gustan y cuáles no? (dos o tres de cada una)
4. ¿Hay restricciones? (industria, cultura local, accesibilidad, colores prohibidos, fuentes obligatorias)
5. ¿En qué pantallas clave se aplicará?

## Método

### 1. Decisiones antes de los colores

Escribe en `brand.md`, en una o dos frases cada uno:

- Audiencia y contexto de uso.
- Los tres adjetivos.
- La tensión de diseño que resuelve la marca (por ejemplo "cercano pero confiable").
- El principio de color y el principio tipográfico.

Si una decisión no se deduce de la entrevista, no la escribas.

### 2. Paleta

- Usa **roles semánticos**, nunca nombres de color como API pública: `background`, `surface`, `surface-muted`, `border`, `text`, `text-muted`, `primary`, `primary-hover`, `primary-contrast`, `accent`, `success`, `warning`, `danger`, `focus`.
- Máximo 14 tokens de color. Un primario, un acento y el resto neutros y semánticos.
- Cada color lleva hex y un uso en una línea.
- Deriva la paleta de la tensión de diseño, no de una plantilla genérica.
- Tema claro únicamente. Los nombres semánticos dejan la puerta abierta a oscuro sin renombrar.

### 3. Tipografía

- Una familia principal y, como máximo, una secundaria. Gratuitas, con acentos y ñ correctos, disponibles vía Google Fonts o `next/font`.
- Escala modular con base de 16 px y razón entre 1.2 y 1.25. Siete pasos como máximo (`xs`, `sm`, `base`, `lg`, `xl`, `2xl`, `3xl`).
- Tres pesos como máximo (por ejemplo 400, 500, 700).
- Alturas de línea: cuerpo 1.5, títulos 1.2, texto pequeño 1.4.
- Sin tracking negativo en cuerpos de texto; como máximo −0.02em en títulos grandes.

### 4. Tokens

Copia `tokens.template.json` a `docs/brand/tokens.json` y complétalo. Solo color y tipografía: **sin espaciado, radios ni sombras**.

- Los nombres del JSON y de `tokens.css` deben coincidir exactamente.
- En CSS, un token `color.primary` se convierte en `--color-primary`; `font.size.base` en `--font-size-base`.
- `tokens.css` va dentro de `:root` y no incluye componentes ni clases utilitarias.

### 5. Reglas de uso

En `brand.md`, reglas breves y verificables:

- El primario se usa para la acción principal; una sola acción primaria por pantalla.
- El acento es para énfasis, no para texto de cuerpo ni para estados.
- El peligro es solo para acciones destructivas o errores.
- Ningún estado se comunica solo con color.
- Un solo `h1` por pantalla; cuerpo nunca menor a 16 px en móvil.
- Enlaces y texto usan `text` o `text-muted`, nunca `accent` como texto.
- Incluye un mapeo opcional a Tailwind si el proyecto lo usa, sin convertirlo en requisito.

### 6. Validación de contraste (bloqueante)

Calcula el ratio WCAG de estos pares y escribe la tabla en `brand.md` con columnas: par, foreground, background, ratio, mínimo, resultado.

| Par | Mínimo |
|---|---|
| `text` sobre `background` | 4.5:1 |
| `text` sobre `surface` | 4.5:1 |
| `text-muted` sobre `background` | 4.5:1 |
| `text-muted` sobre `surface` | 4.5:1 |
| `primary-contrast` sobre `primary` | 4.5:1 |
| `primary` como texto sobre `background` | 4.5:1 |
| `danger` como texto sobre `surface` | 4.5:1 |
| `border` sobre `surface` | 3:1 |
| `focus` sobre `background` | 3:1 |

Si un par falla, ajusta el color y vuelve a comprobar. **Nunca entregues tokens con un par por debajo del mínimo.** Si necesitas la excepción de texto grande (3:1), indícalo explícitamente en la tabla.

## Salida

Escribe únicamente estos archivos en `docs/brand/` de la app destino:

- `brand.md` — decisiones, paleta, tipografía, reglas y tabla de contrastes.
- `tokens.json` — color y tipografía.
- `tokens.css` — las mismas variables en `:root`.

No modifiques código, configuración, componentes ni estilos de la app. Si `docs/brand/` no existe, créalo. Aplicar los tokens es un paso de implementación aparte.

## Terminado cuando

- Todos los pares obligatorios pasan el mínimo.
- `tokens.json` y `tokens.css` contienen exactamente los mismos nombres.
- `brand.md` incluye la tabla de contrastes completa.
- No hay logo, voz, componentes, espaciado, radios, sombras ni modo oscuro.
- Le dices al usuario qué revisar y que conectar los tokens a la app es un paso posterior.
