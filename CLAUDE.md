# Conmomet App — Instrucciones para Claude Code

## Regla obligatoria: selects que traen datos de otro módulo usan un endpoint `/lookup/*`

Cuando un select de un formulario necesita listar registros que pertenecen a **otro módulo**
del sistema (ej: Carga de Horas necesita el combo de Proyectos, que es un módulo de Gestión de
Clientes), el combo **no debe pegarle al endpoint CRUD completo de ese módulo**
(`GET /projects`, `GET /vehicles`, etc.). En vez de eso, se agrega/reusa un endpoint
`GET /lookup/<recurso>` en `api_conmomet/controllers/lookupController.js` (registrado en
`routes/index.js` solo con `verifyToken`, sin `authPermission`).

Por qué: `authPermission` deriva el permiso requerido del primer segmento de la URL — así que
pegarle al endpoint completo obliga a otorgarle al rol el permiso de "gestión completa" de ese
módulo entero (y automáticamente le destraba su ítem de menú), solo para poder llenar un combo.
Con un endpoint `/lookup/*` separado, el permiso del select queda desacoplado del permiso de
gestión del módulo de origen.

Reglas concretas:

- El endpoint `/lookup/*` devuelve **solo los campos que el select realmente usa** (id + lo que
  se muestra/filtra), nunca el payload completo del recurso. En el frontend, cada uno tiene su
  propio tipo mínimo (`LookupProject`, `LookupVehicle`, etc. en `src/utils/api.ts`) — no reusar
  el tipo completo del recurso, sería mentir sobre qué campos están disponibles.
- Si el select depende de otro select ya elegido (ej: Supervisor depende del Proyecto elegido),
  el lookup se anida bajo el recurso padre: `GET /lookup/projects/:id/supervisors`.
- Si el combo ya pertenece al **mismo módulo** que el formulario que lo usa (ej: el combo de
  Rubros dentro del propio formulario de Presupuesto), no aplica esta regla — seguir usando el
  endpoint normal, ya tiene sentido que comparta permiso.
- Excepción: si el recurso referenciado **no tiene ítem de menú propio** (ej:
  `client-supervisors`, que solo vive dentro de un diálogo de Clientes), no hace falta
  lookup-ificarlo — otorgar el permiso `_read` directo no expone ningún módulo nuevo.
- Referencia de implementación: `GET /lookup/roles` (el primero, para el combo de Rol en
  `UserForm.tsx`) y los agregados para Carga de Horas (`/lookup/projects`,
  `/lookup/projects/:id/supervisors`, `/lookup/vehicles`, `/lookup/holidays`,
  `/lookup/budget-item-types`, `/lookup/payroll-concepts`, `/lookup/pay-periods`).

Esta regla es para selects **nuevos** de acá en adelante — no es una migración retroactiva de
los combos que ya existen fuera de Carga de Horas.

## Regla obligatoria: mobile-first en TODO módulo nuevo

Cualquier página o módulo nuevo (dashboard/*, portal/*) que liste registros se construye
**mobile-first**: la vista de cards para mobile no es un "extra" que se agrega después,
es parte del mismo PR/commit que crea el módulo. Nunca se entrega un módulo nuevo con
solo la tabla desktop.

Esto se detectó como problema real: los módulos de **Materiales** y **Unidades de Medida**
se crearon sin la adaptación mobile mientras el resto de los módulos del dashboard sí la
tenían (2026-09-04).

### Patrón a seguir (copiar tal cual, no reinventar)

Cada vista de listado tiene dos bloques hermanos: cards para mobile, tabla para desktop,
alternados con `Box sx={{ display: {...} }}`:

```tsx
{/* Mobile Cards */}
<Box sx={{ display: { xs: 'block', md: 'none' } }}>
  {items.length === 0 ? (
    <Typography color="text.secondary" textAlign="center" py={4}>No hay registros</Typography>
  ) : (
    <Stack spacing={2}>
      {items.map((item) => (
        <Card key={item.id} sx={{ p: 2, borderRadius: 2 }}>
          {/* mismos datos y acciones que en la fila de la tabla */}
        </Card>
      ))}
    </Stack>
  )}
</Box>

{/* Desktop Table */}
<Box sx={{ display: { xs: 'none', md: 'block' } }}>
  <TableContainer component={Paper} elevation={2}>
    <Table>...</Table>
  </TableContainer>
</Box>
```

Reglas concretas:

- Las cards de ítems mobile van con el componente **`Card`** de `@mui/material`, **nunca `Paper`**.
  `Paper` se reserva para el `TableContainer` desktop, paneles de filtros, o estados vacíos
  puntuales (no repetidos por ítem).
- `Card` ya trae gratis el efecto de movimiento estándar de la app (`translateY(-6px)` + sombra
  + `transition` de 0.25s) porque está definido una sola vez como override global en
  `src/app/theme.ts` (`MuiCard.styleOverrides.root`). No dupliques ese `sx` a mano.
- Cada card mobile debe mostrar la misma información y las mismas acciones (editar, eliminar,
  etc.) que su fila equivalente en la tabla desktop — no una versión recortada.
- Referencias de implementación ya existentes en el repo: `src/app/dashboard/categories/page.tsx`,
  `src/app/dashboard/guilds/page.tsx`, `src/app/dashboard/materials/page.tsx`,
  `src/app/dashboard/material-units/page.tsx`.

### Checklist antes de dar por terminado un módulo nuevo con listado

1. ¿Existe el bloque `{ xs: 'block', md: 'none' }` con `Card` por ítem?
2. ¿La tabla desktop está envuelta en `{ xs: 'none', md: 'block' }`?
3. ¿Se probó visualmente en un viewport angosto (≈375–414px)?

## Regla obligatoria: mantener actualizada la sección de Ayuda

La app tiene un Centro de Ayuda en `/dashboard/help` (último ítem del menú lateral) que
documenta, en lenguaje simple para el usuario final, el flujo correcto de cada operación
importante (alta de usuarios, tarifas especiales, presupuestos, OCAs, etc.).

El contenido vive en `src/content/help/*.md`, indexado en `src/content/help/helpTopics.ts`.
Cada `.md` cierra con un comentario `<!-- ref: ... -->` que apunta a los archivos de
frontend/backend reales que implementan ese flujo.

**Cualquier cambio de comportamiento en un flujo ya documentado ahí debe reflejarse en su
`.md` correspondiente, en el mismo commit/PR que hace el cambio de código.** Si se agrega un
flujo nuevo digno de documentar, sumarlo como un tema más en `helpTopics.ts` (con su propio
`.md`), no como excepción aparte.

## Selects con alta inline: usar `CreatableSelect`

Cuando un campo es "elegir de una lista" y conviene poder **crear** una opción nueva sin salir
del formulario, usar `src/components/common/CreatableSelect.tsx` (select genérico) en vez de un
`Autocomplete` suelto con `createFilterOptions`. Ejemplos a copiar:
`ProviderPriceAutocomplete` y `MaterialSelect` en `src/components/materials/`.

## Regla obligatoria: todo panel de filtros usa `ListFilters` + `FilterSelect`

Antes de esta regla había 4 variantes de panel de filtros convivientes en el repo (`Paper`+`Grid`
con `TextField select native`, `TextField` suelto sin contenedor, `Card`+`CardContent` con
`boxShadow` propio, `Paper` como fila flex), con inconsistencias de label, de opción vacía y de
estética (ver `FLOWS.md` flujo 39). Está prohibido volver a armar un panel de filtros a mano.

Usar siempre `src/components/common/ListFilters.tsx`:

- `<ListFilters search={...} onSearchChange={...} searchPlaceholder="..." onClear={...} hasActiveFilters={...}>`
  — el contenedor. La barra de búsqueda es **siempre el primer control**, a ancho completo, en
  su propia fila — nunca un campo de texto más entre los selects.
- `<FilterSelect label="Cliente" value={...} onChange={...} emptyLabel="Todos los clientes" options={[...]} />`
  por cada select — reemplaza tanto al `TextField select native` como al `FormControl`+`Select`+`MenuItem`.
- El botón "Limpiar filtros" lo pone el componente solo si se pasa `onClear` y `hasActiveFilters` es `true`.

Convenciones de contenido (las impone el componente, no se pisan a mano):
- Label del select **sin** el prefijo "Filtrar" — `"Cliente"`, no `"Filtrar Cliente"`.
- Opción vacía en plural y descriptiva — `"Todos los clientes"`, `"Todas las plantas"`,
  `"Todos los estados"` — nunca `""`, `"Todos"` ni `"all"`.

Criterio server-side vs. client-side (no es libre, es por tipo de listado):
- **Server-side** (manda los filtros como query params al `getAll` del servicio): todo listado
  operativo que crece con el uso diario — Proyectos, Presupuestos, Pedidos de Cotización, OCAs,
  Carga de Horas, Facturación, Adelantos, Asignaciones, EPP, Licencias, Materiales, Herramientas,
  Adicionales, y también Clientes/Usuarios/Empleados/Plantas/Vehículos aunque crezcan más lento.
  Razón: **ningún endpoint de listado de negocio pagina** (las únicas 3 excepciones son por
  cursor: notificaciones, seguimiento de proyectos, historial de presupuestos) — un filtro
  client-side queda roto en silencio el día que un listado se pagina, porque busca solo dentro de
  la página ya cargada.
- **Client-side** (`.filter()` en memoria sobre el array ya traído): solo catálogos chicos de
  mantenimiento manual que se estancan en decenas de filas — Rubros, Unidades de Medida, Tipos de
  Herramienta, Categorías, Gremios, Conceptos de Liquidación, Categorías de Costo Patronal,
  Categorías de Documento, Roles.
- El debounce (solo en la búsqueda de texto, los selects consultan al tocarlos) sigue el patrón de
  `additionals/page.tsx`: `setTimeout(load, search ? 300 : 0)`.

Migrados a este estándar: Proyectos (`dashboard/projects/page.tsx`), Pedidos de Cotización
(`dashboard/quote-requests/page.tsx`) y Presupuestos (`dashboard/budgets/page.tsx`). El resto de
los listados queda pendiente de migrar — ver `FLOWS.md` flujo 39 para la lista completa.
