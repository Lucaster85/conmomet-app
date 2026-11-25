# Conmomet App - Frontend

## 📋 Descripción
Sistema de gestión empresarial (dashboard privado + portal del empleado) y web institucional pública, desarrollado con Next.js, TypeScript y Material-UI.

## 🚀 Tecnologías
- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Dashboard y portal**: Material-UI (`@mui/material`, `@mui/x-date-pickers`) con emotion (`sx`)
- **Web pública** (landing y `/trabaja-con-nosotros`): Tailwind CSS v4, **solo ahí**. El dashboard no usa clases de Tailwind
- **Animación**: sin librerías; `IntersectionObserver` + CSS (`@keyframes` en `globals.css`)
- **Tipografías**: Plus Jakarta Sans (cuerpo) y Montserrat (titulares de la web pública), vía `next/font/google`
- **Autenticación**: JWT
- **Backend**: `api_conmomet` (Node.js, puerto 4000 en local)

## 📁 Estructura del Proyecto
```
src/
├── app/
│   ├── layout.tsx                 # Layout raíz: MUI, fuentes, EnvironmentProvider
│   ├── globals.css                # Tailwind v4, tokens --pub-*, keyframes y CSS de impresión
│   ├── (public)/                  # Route group de la web pública (no cambia las URLs)
│   │   ├── layout.tsx             # Wrapper + PublicHeader + PublicFooter
│   │   ├── page.tsx               # Landing (/)
│   │   └── trabaja-con-nosotros/  # Formulario público de postulaciones
│   ├── login/ · invite/ · portal/ · dashboard/   # MUI, sin Tailwind
│   └── brand/[file]/              # Logos e identidad por marca
├── components/
│   ├── public/                    # Web pública (ver abajo)
│   └── …                          # Resto: MUI, para el dashboard y el portal
└── utils/                         # api.ts, auth.ts, validators.ts, candidates.ts, etc.
```

## 🌐 Web pública (`src/components/public/`)

Lenguaje visual: fondo claro, titulares en `font-display` con `tracking-tight`, secciones con *eyebrow* + guioncito, cards que levitan al hover y aparición escalonada al scrollear. Azul de marca + ámbar solo como color de acción. Tokens en `globals.css` (`--pub-*`, mapeados a `pub-*` en `@theme inline`).

- **Primitivos**: `Section` (wrapper canónico), `Reveal` (aparición al scrollear, prop `delay`/`as`), `Button` (`buttonClasses(variant)`: `action` / `ghost` / `dark`), `Field` (`Field`, `TextAreaField`, `SelectField`), `icons` (SVG inline).
- **Esqueleto**: `PublicHeader`, `PublicFooter`, `FloatingCta` (mobile), `Hero` con `SiloBlueprint` (plano de silo que se autodibuja).
- **Secciones de la landing**: `Nosotros`, `Servicios`, `NuestroTrabajo`, `Clientes`, `Contacto` (con `ContactForm`).
- **Postulaciones**: `JobApplicationForm`.
- Los textos de contacto y redes del pie están fijos en `PublicFooter` y `Contacto`.
- `prefers-reduced-motion` apaga todas las animaciones y deja el plano ya dibujado.

## 🔧 Scripts Disponibles
```bash
npm run dev     # Servidor de desarrollo
npm run build   # Build de producción (no correrlo con el dev server levantado: pisa .next)
npm run start   # Servidor de producción
npm run lint    # Linter
npx tsc --noEmit  # Chequeo de tipos
```

## 🌐 Variables de Entorno
Se leen en runtime desde el servidor (layout raíz → `window.__ENV__`), sin rebuild:
```bash
API_BASE_URL=http://localhost:4000
GOOGLE_PLACES_API_KEY=
CLARITY_PROJECT_ID=
APP_NAME= / APP_LEGAL_NAME= / APP_ENV_LABEL= / APP_ENV_COLOR= / APP_BRAND=
```
(Las variantes `NEXT_PUBLIC_*` de las tres primeras quedan como fallback.)

## 📚 Documentación relacionada
- `../FLOWS.md`: flujos funcionales y decisiones (rediseño de la landing: §85).
- `CLAUDE.md`: reglas obligatorias de desarrollo (mobile-first, `AppDialog`, `ListFilters`, Ayuda).
- `src/content/help/`: Centro de Ayuda del usuario final.

---
*Documentación actualizada: 25 de Noviembre, 2026*
