# Conmomet App — Instrucciones para Claude Code

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
