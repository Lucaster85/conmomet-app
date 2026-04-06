---
description: Skill de diseño UI/UX premium y moderno para componentes de MUI
---
# Reglas de Diseño GUI para Conmomet

Este workflow define los estándares visuales que se deben aplicar en cada componente para garantizar una interfaz de usuario "Premium", dinámica y estética, basada en Material-UI. 

Toda vez que me pidas escribir o rediseñar un archivo de React/MUI, aplicaré estos lineamientos.

## 1. Diseño Base y Contenedores
- **Radios de Borde (Border Radius):** Abandonar las esquinas puntiagudas clásicas. Utilizar bordes suaves:
  - Tarjetas (Cards), Modales y Contenedores principales: `borderRadius: '16px'`
  - Botones y campos de texto (TextFields): `borderRadius: '8px'` a `12px`
- **Elevación y Sombras Modernas:** En lugar de los valores por defecto de MUI (como `boxShadow: 1`, `elevation={1}`), usar sombras amplias e imperceptibles que aporten profundidad sin ensuciar:
  - Ej. Sombra suave: `boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)'`
  - Ej. Sombra amplia (para modales o menús interactivos): `boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'`
- **Efecto Traslúcido (Glassmorphism):** Para elementos fijos como AppBar, Sticky headers, o modales flotantes, usar: `backdropFilter: 'blur(10px)'` y un fondo semitransparente como `backgroundColor: 'rgba(255, 255, 255, 0.8)'`.

## 2. Tipografía (Fuente Geist)
- **Títulos y Jerarquía:** Los encabezados (`variant="h1"`, `h2`, etc.) deben verse más limpios. Usa `fontWeight: 600` o `700` y dales un tracking ligeramente negativo, por ejemplo `letterSpacing: '-0.02em'` para un aspecto elegante y actual.
- **Contraste de Texto:** No usar texto 100% negro. Para texto primario utilizar tonos grises oscuros (ej. `#1E293B` o `#1e1e1e`), y para subtítulos, etiquetas o hints usar gris plomo más tenues (ej. `#64748B` o `#71717a`).

## 3. Micro-interacciones y Animaciones
- **Transiciones y Hover:** Todo elemento interactivo (botones, tarjetas informativas, iconos de acción) debe tener una transición:
  - `transition: 'all 0.2s ease-in-out'`
- **Efectos de tarjetas interactivas:** En cards que sirven de botón o navegación:
  - `'&:hover': { transform: 'translateY(-4px)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }`
- **Estados Activos:** Usar animaciones suaves (`sx={{ cursor: 'pointer', opacity: 0.8, '&:hover': { opacity: 1 } }}`) en íconos secundarios.

## 4. Estructura y Espaciado
- **Abundante Espacio en Blanco (Whitespace):** Dejar que la UI interior "respire". Utiliza de manera prominente la propiedad `p` o `padding` dentro del `sx`.
- **Flexbox Uniforme:** Utilizar abundantemente los componentes `<Stack>` y `<Box>` en MUI con atajos de flexbox y `gap={2}` o `gap={3}` para alinear contenido, evitando márgenes estáticos.

## 5. Criterios de Color (Basados en el Theme)
- Seguir utilizando el azul definido en el proyecto (`#1976d2`).
- De ser pertinente para destacar algún contenedor importante, se pueden explorar fondos con gradientes muy sutiles:
  - Ej: `background: 'linear-gradient(135deg, rgba(25,118,210,0.05) 0%, rgba(25,118,210,0) 100%)'`
- Dar prioridad a los fondos base de color gris extremadamente claro (ej. `#fafafa` o `#F8FAFC`) en layouts y vistas para que las Cards blancas contrasten elegantemente.

## 6. Responsividad y Diseño Multi-dispositivo (Mobile-First)
- **Adaptabilidad Obligatoria:** Absolutamente todo componente nuevo o modificado DEBE ser responsivo. Nunca asumas que el usuario estará en una pantalla grande.
- **Uso de Breakpoints:** Utiliza la sintaxis de objetos de MUI en la prop `sx` para adaptar tamaños, márgenes y comportamientos estructurales. (Ej: `{ xs: '100%', sm: '50%', md: '33%' }`).
- **Comprobación Cruzada:** Valida que la estructura del componente tenga sentido tanto apilada en vertical (Móvil - `xs`), como en cuadrícula o flujo horizontal (Tablet/Desktop - `sm`/`md` en adelante).
- **Control de espaciados fijos:** Evita asignar alturas (`height`) o anchos (`width`) estáticos y fijos, utiliza proporciones, porcentajes (`%`) o comportamientos dinámicos como `flex: 1`.
