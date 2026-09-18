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

## Presupuesto de horas hombre (con precio)

Además del Remito, en OCAs de **Horas Hombre** hay dos botones extra —visibles solo para quien
tenga permiso de precios de Presupuestos— para armarle al cliente el mismo detalle pero con
costo:

- **"Cargar Precio"**: define el **valor de referencia de la hora** para esa OCA. Se sugiere
  automáticamente el último valor cargado para ese cliente, pero se puede cambiar libremente.
  Cada cambio queda guardado en un historial por cliente (accesible desde "Ver historial" en el
  mismo diálogo). Es opcional — si no se carga, el remito común sigue funcionando igual.
  **Importante**: este valor es independiente del que se usa en el módulo de Presupuestos de
  obra — son dos conceptos de precio distintos que no se mezclan.
- **"Imprimir Presupuesto"**: genera el mismo tipo de documento que el Remito, pero **agrupado
  por día** (no por empleado) — una fila por fecha con la entrada más temprana, la salida más
  tardía, y las horas simples/50%/100% sumadas entre todos los empleados que trabajaron ese día,
  más la cantidad de personas. El valor de la hora (y sus derivados al 50%/100%) se muestra
  aparte, y al final se calcula el costo total. Queda deshabilitado hasta que se cargue el
  precio.

El precio de una OCA queda **congelado** en el momento de cargarlo — si más adelante se actualiza
el valor de referencia del cliente, los presupuestos ya generados no cambian.

## Presentar el presupuesto a administración del cliente

No todas las OCAs llevan presupuesto. Al aprobar una OCA de horas hombre se puede tildar
**"Requiere presupuesto"** — por defecto viene destildado. Si te olvidaste o te equivocaste, se
puede corregir después con el botón "Requiere Presupuesto: Sí/No" en la ficha de la OCA.

Una vez marcada, el ciclo es:

1. **Cargar Precio** (ver arriba) — obligatorio antes de poder presentar.
2. **Presentar Presupuesto** — lo manda a administración del cliente (un contacto distinto del
   supervisor de obra que aprobó el remito).
3. Administración lo **aprueba** o lo **rechaza**.

**Si administración rechaza el presupuesto** (por ejemplo, porque no está de acuerdo con la
cantidad de horas declaradas), se rechaza **toda la OCA** — aunque ya estuviera aprobada por el
supervisor de obra. El sistema usa el mismo mecanismo de "Corregir y Duplicar" que ya conocés
para remitos rechazados: se genera una OCA nueva con las horas desvinculadas para poder editarlas,
y hay que volver a presentarla al supervisor **y** volver a presentar su presupuesto desde cero.
El presupuesto rechazado queda guardado como historial en la OCA vieja.

### Aviso de presupuestos pendientes

Un usuario configurado en **Configuración General → OCAs — Presupuestos** ve, arriba de todo en su
dashboard, un aviso con la cantidad de OCAs aprobadas que requieren presupuesto y todavía no se
presentaron a administración — el aviso no desaparece con solo cargar el precio, hace falta
presentarlo.

## Anular una OCA

**"Anular OCA"** solo está disponible mientras el remito está en **Pendiente** o
**Presentado**. Al anular, todas las horas que tenía cargadas quedan liberadas y vuelven a
estar disponibles para incluirse en otra OCA. Un motivo de anulación es opcional pero
recomendado.
