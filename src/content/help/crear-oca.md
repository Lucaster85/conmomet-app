## ¿Qué es una OCA?

Una **OCA** (también llamada **Remito**) es el documento que le presentamos a un cliente para
que apruebe las horas trabajadas o el uso de una grúa/equipo, antes de facturarlas. Se ubica en
**Gestión de Clientes → Remitos / OCAs**.

Hay dos tipos, y cada uno agrupa la información de forma distinta:

- **Horas Hombre**: agrupa horas de un mismo **Supervisor** del cliente.
- **Horas Grúa / Equipos**: agrupa horas de un mismo **Proyecto**.

## El ciclo de vida de una OCA

Una OCA siempre pasa por estos estados, en este orden:

1. **Pendiente** — recién creada. Todavía se puede editar: agregar o quitar horas, agregar
   líneas manuales, o borrar líneas.
2. **Presentado** — ya se envió al cliente para su revisión. No se puede editar hasta que el
   cliente responda.
3. **Aprobado** o **Rechazado** — el cliente dio su conformidad, o la rechazó con un motivo.

Desde **Rechazado** se puede **corregir**, y desde **Pendiente** o **Presentado** se puede
**anular**. Un remito **Aprobado** no se puede anular ni corregir.

## Paso a paso: crear una OCA nueva

1. Entrar a **Remitos / OCAs**, elegir la pestaña **Horas Hombre** o **Horas Grúa / Equipos**
   según corresponda, y tocar **"Generar Remito / OCA"**.
2. Elegir el **Cliente**. El sistema muestra automáticamente las horas ya aprobadas de ese
   cliente que todavía no fueron incluidas en ningún remito.
   - Para **Horas Hombre**, además hay que elegir/filtrar por **Supervisor**: todas las horas
     de la OCA tienen que pertenecer al mismo supervisor.
   - Para **Horas Grúa / Equipos**, hay que elegir el **Proyecto**: todas las horas de la OCA
     tienen que pertenecer al mismo proyecto.
   - Solo aparecen horas que estén **aprobadas**, marcadas como **"Horas en Planta"**, con
     **generación de OCA habilitada**, y que **no estén ya asignadas a otra OCA**.
3. Tildar las horas que se quieren incluir (o dejar la selección vacía si el remito va a
   armarse solo con líneas manuales, algo permitido únicamente en Horas Grúa).
4. Guardar. La OCA queda creada en estado **Pendiente**, con un número único autogenerado
   (por ejemplo `OCA-2026-014`).

### Mientras está en Pendiente

Con la OCA todavía en **Pendiente** se puede seguir ajustando antes de mandarla al cliente:

- **"Agregar Línea Manual"**: suma una línea que no viene de un registro de horas cargado
  (por ejemplo, un ítem adicional a facturar).
- Agregar o quitar horas ya cargadas con los botones correspondientes del listado.
- Si una línea viene de un registro de horas real, solo se le puede editar la tarea/nota — no
  las horas ni la fecha (eso evita descuadres contra lo que el empleado cargó). Las líneas
  manuales o las que vienen de una corrección sí se pueden editar libremente.

## Presentar, aprobar o rechazar

- **"Presentar a Cliente"**: pasa la OCA a **Presentado**. A partir de acá ya no se puede
  editar el contenido.
- **"Aprobar / Cargar Remito"**: pasa la OCA a **Aprobado**. Opcionalmente se puede adjuntar
  una foto o escaneo del remito firmado por el cliente — se puede volver a este paso más
  adelante para subir o reemplazar el comprobante aunque ya esté aprobado.
- **"Rechazar Remito"**: pasa la OCA a **Rechazado**. El motivo del rechazo es obligatorio y
  queda guardado para consultarlo después.

## Si el cliente rechaza la OCA

Tocar **"Corregir y Duplicar"**. Esto **no reabre** la OCA rechazada (que queda como está, con
una nota indicando que fue corregida): crea una **OCA nueva en Pendiente**, con las mismas
líneas pero ya **desvinculadas** de sus registros de horas originales. Gracias a eso, en la
nueva OCA sí se pueden editar libremente las horas, fechas y tareas antes de volver a
presentarla.

## Anular una OCA

**"Anular OCA"** solo está disponible mientras el remito está en **Pendiente** o
**Presentado**. Al anular, todas las horas que tenía cargadas quedan liberadas y vuelven a
estar disponibles para incluirse en otra OCA. Un motivo de anulación es opcional pero
recomendado.
