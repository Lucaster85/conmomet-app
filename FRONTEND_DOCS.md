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
- **Esqueleto**: `PublicHeader` (menú por props), `PublicFooter` (datos por props), `FloatingCta` (mobile), `PublicLink` (enlace de contacto/pie armado desde `kind` + `value`).
- **Motor de bloques** (`blocks/`, FLOWS §86): la landing no es una composición fija sino lo que declara `public/brands/<marca>/landing.json`. `registry.tsx` mapea tipo → componente (`HeroBlock`, `AboutBlock`, `ServicesBlock`, `WorksBlock`/`WorksGallery`, `ClientsBlock`, `ContactBlock`); `resolve.ts` mezcla el manifiesto con lo editado en la base. El hero tiene dos fondos: `SiloBlueprint` (`blueprint-silo`) y `GridBlueprint` (`blueprint-grid`). Para un tipo de bloque nuevo ver el comentario de `registry.tsx`.
- **Manifiesto y contenido**: `src/config/landing.ts` (lectura y validación del archivo), `src/utils/siteContent.ts` (trae `/public/site` y mezcla; es lo que usan el layout y la página). Sin `landing.json` en la carpeta de marca no hay sitio público: `/` va al login.
- **Postulaciones**: `JobApplicationForm`.
- Teléfonos, redes, servicios y clientes ya no están en el código: salen del manifiesto y se editan en Configuración General → Sitio web público.
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
