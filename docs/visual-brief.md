# Visual Brief — IronLog

> Tu cuaderno de gym. Rapido, limpio, tuyo.
> Fecha: 2026-02-27

---

## Personalidad

**Bold, potente, funcional, directo, motivador.**

IronLog transmite energia. No es una app delicada ni decorativa — es una herramienta de rendimiento. Los numeros son grandes, los contrastes son fuertes, y cada pantalla esta disenada para usarse con una mano, entre sets, sudando. Pero no es caos: la informacion esta ordenada con precision quirurgica.

**Referencia principal:** Hevy — UI moderna, cards claras, buen uso del espacio, optimizada para gym.

---

## Publico objetivo

**Solo Alvaro.** App personal, distribucion APK directa, cero cloud, cero cuentas. Contexto de uso: en el gym, entre sets, con una mano, pantalla con sudor. Necesita datos grandes, taps amplios, y cero friccion.

---

## Paleta de colores (dark-only)

| Token                | Hex                     | Uso                                         |
| -------------------- | ----------------------- | ------------------------------------------- |
| `bg-primary`         | `#0A0A0A`               | Fondo principal, base de toda la app        |
| `bg-secondary`       | `#111111`               | Cards, secciones elevadas                   |
| `bg-tertiary`        | `#1A1A1A`               | Inputs, hovers, elementos interactivos      |
| `bg-elevated`        | `#1F1F1F`               | Cards destacadas, modals                    |
| `border`             | `#2E2E2E`               | Bordes de cards, divisores                  |
| `border-bright`      | `#3A3A3A`               | Bordes en hover, focus                      |
| `text-primary`       | `#EDEDED`               | Texto principal, headings, numeros grandes  |
| `text-secondary`     | `#A3A3A3`               | Labels, metadata, texto de apoyo            |
| `text-tertiary`      | `#525252`               | Placeholders, hints, texto deshabilitado    |
| `brand-blue`         | `#3291FF`               | Botones primarios, links, focus rings       |
| `brand-red`          | `#F43F5E`               | PRs, records, badges de logro               |
| `theme-slate`        | `#64748B`               | Color tematico: iconos decorativos, acentos |
| `theme-slate-bright` | `#94A3B8`               | Variante clara del slate para contraste     |
| `success`            | `#22C55E`               | Racha activa, set completado, positivo      |
| `warning`            | `#F59E0B`               | Timer corriendo, alertas                    |
| `error`              | `#EF4444`               | Borrar, descartar, errores                  |
| `chart-line`         | `#3291FF`               | Linea principal de graficas                 |
| `chart-area`         | `rgba(50,145,255,0.15)` | Area bajo la curva en graficas              |
| `chart-grid`         | `#2E2E2E`               | Gridlines de graficas                       |
| `chart-pr`           | `#F43F5E`               | Marcadores de PR en graficas                |

---

## Tipografia

- **Headings:** Geist Sans — 700 (bold) para titulos de pantalla, 600 (semibold) para secciones
- **Body:** Geist Sans — 400 (regular) para texto, 500 (medium) para labels
- **Mono:** Geist Mono — 400 (regular) para numeros de peso/reps (datos de rendimiento)
- **Fallback mobile:** Inter, -apple-system, sans-serif

### Escala

| Token  | Size | Line Height | Uso                                        |
| ------ | ---- | ----------- | ------------------------------------------ |
| `xs`   | 12px | 16px        | Badges de tipo, timestamps                 |
| `sm`   | 14px | 20px        | Labels de campos, metadata                 |
| `base` | 16px | 24px        | Body text, nombres de ejercicios en listas |
| `lg`   | 18px | 28px        | Subtitulos de seccion                      |
| `xl`   | 20px | 28px        | Nombres de ejercicio en workout            |
| `2xl`  | 24px | 32px        | Titulos de seccion (Home stats)            |
| `3xl`  | 30px | 36px        | Titulos de pantalla                        |
| `4xl`  | 36px | 40px        | Numeros grandes de stats                   |
| `5xl`  | 48px | 48px        | Timer countdown, numero hero               |

### Regla clave para gym UX

Los **numeros de rendimiento** (peso, reps, timer) usan Geist Mono en tamano grande. Son el protagonista visual de la app — el usuario necesita leerlos en un vistazo rapido.

---

## Iconografia

- **Set:** Lucide Icons
- **Estilo:** Outlined (stroke), 1.5px stroke width
- **Tamano base:** 20px en UI, 24px en tab bar, 16px inline con texto
- **Color:** `currentColor` (hereda del contexto)

### Iconos de tabs

| Tab       | Icono Lucide | Activo     |
| --------- | ------------ | ---------- |
| Home      | `Home`       | brand-blue |
| Exercises | `Dumbbell`   | brand-blue |
| Routines  | `ListChecks` | brand-blue |
| History   | `Clock`      | brand-blue |

---

## Espaciado clave (mobile-first)

| Token     | Valor | Uso                                |
| --------- | ----- | ---------------------------------- |
| `space-1` | 4px   | Gap minimo                         |
| `space-2` | 8px   | Padding compacto, gap entre badges |
| `space-3` | 12px  | Gap entre sets                     |
| `space-4` | 16px  | Padding de cards, gap entre items  |
| `space-5` | 20px  | Padding lateral de pantalla        |
| `space-6` | 24px  | Separacion entre secciones         |
| `space-8` | 32px  | Espacio grande entre bloques       |

---

## Decisiones de diseno especificas de IronLog

1. **Dark-only** — No hay light mode. Decision confirmada. El gym es oscuro, la pantalla no debe cegar.
2. **Numeros como heroes** — Peso, reps, timer: en Geist Mono, grande, blanco puro sobre fondo oscuro.
3. **Cards con borde, no sombra** — En dark mode las sombras no funcionan. Borde sutil + fondo elevado.
4. **Tab bar solida** — Fondo opaco `bg-secondary`, borde superior, iconos Lucide.
5. **Touch targets grandes** — Minimo 48px. Botones de "+" y timer son extra grandes (56px+).
6. **Feedback haptico** — Timer finish, set completado, PR nuevo. Vibracion corta y satisfactoria.
7. **Set row como protagonista** — Cada fila de set es horizontal: numero | peso | reps | (delete). Input directo, sin modals.
8. **Timer como banner** — Pegado al bottom, encima del tab bar. Visible pero no bloquea interaccion.

---

## Referencias visuales

- **Hevy** — Layout de workout tracking, cards de ejercicio, set input inline
- **Apple Watch Fitness** — Numeros grandes, colores vibrantes sobre negro
- **Linear** — Densidad de informacion bien gestionada, dark mode elegante

---

## Estado

**APROBADO** — 2026-02-27. Implementar siguiendo el plan de `docs/plans/2026-02-26-ironlog-implementation.md`.

## Notas

- Firma: `Made with 🏋️ by Alvaro Torres`
- i18n: NO en MVP (decision del design doc — solo para Alvaro)
- Dark mode toggle: NO (dark-only)
- Color tematico slate (#64748B) para elementos decorativos, pero brand-blue (#3291FF) para acciones
