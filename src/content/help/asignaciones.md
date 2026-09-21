## ¿Qué es Asignaciones?

Es la pantalla donde se entrega y devuelve tanto **herramientas** como **grúas/vehículos** — es
una sola pantalla para los dos tipos de activo. Se ubica en **Pañol → Asignaciones**.

## Crear una asignación

Con el botón **"Nueva Asignación"**:

- Primero se elige si es una **Herramienta** o una **Grúa/Vehículo** (toggle).
- El selector de activo solo muestra los que están **Disponibles** — si algo ya está reservado,
  entregado, en reparación, de baja o extraviado, no aparece como opción.
- **Responsable** (empleado): **obligatorio para herramientas**, opcional para grúas/vehículos.
- **Proyecto**: siempre opcional.
- Un toggle define qué pasa al guardar:
  - **"Solo reservar"**: la asignación nace en estado **Reservada**, sin fecha ni condición
    todavía — reserva el activo para más adelante.
  - **"Entregar ahora"**: pide Fecha de entrega, Condición, Completitud y Notas, y la
    asignación nace directo en **Entregada**.

## Confirmar la entrega de una reserva

Si la asignación quedó como **Reservada**, más adelante se confirma la entrega con Condición y
Completitud (ambas obligatorias en ese momento). Al confirmar, el activo pasa a estado
**Entregada**.

## Registrar una devolución

Sobre una asignación **Entregada**, se registra Condición y Completitud de la devolución, y se
elige el **Estado resultante** del activo: **Disponible** o **En reparación**.

Si se elige "En reparación" **y es una herramienta**, el sistema pide además un responsable de
la reparación (ver el tema **Reparación de Herramientas** para el detalle de cómo funciona el
aviso). Las grúas/vehículos no tienen esta opción — al pasar a "En reparación" no se les asigna
ningún responsable.

## Cancelar una reserva

Una asignación **Reservada** todavía se puede cancelar (libera el activo, que vuelve a estar
Disponible). Una vez que la entrega ya se confirmó, no se puede cancelar — el cierre normal de
una entrega es registrar su devolución.

## Filtros de la pantalla

Por tipo de activo (Todos / Herramientas / Grúas-Vehículos) y por estado de la asignación
(Todos / Reservada / Entregada / Devuelta).

<!-- ref: conmomet-app/src/app/dashboard/asset-assignments/page.tsx, api_conmomet/controllers/assetAssignmentController.js -->
