## ¿Qué es el módulo de EPP?

Es el registro de entrega de **Elementos de Protección Personal** (botines, pantalones, cascos,
guantes, etc.) a cada empleado. Se ubica en **Personal → Entrega de EPP**.

## Catálogo de artículos

Botón **"Catálogo"**: define qué artículos existen, antes de poder entregarlos.

- **Nombre*** y **Categoría*** (Calzado, Indumentaria, Protección Cabeza, Protección Manos,
  Protección Ocular, Otros).
- **Tipo de Talle**: Sin talle (cascos, antiparras), Numérico (calzado) o Alfabético (S/M/L/XL).
- **Vida útil (meses)**: si el artículo se vence con el uso (ej. un pantalón cada 4 meses),
  cargarla acá. Si se deja **vacía**, el artículo se entrega a demanda y nunca vence (ej.
  guantes de látex).
- **Avisar días antes**: con cuántos días de anticipación se considera "por vencer" una entrega
  de ese artículo (15 por defecto).
- Los artículos se pueden **desactivar** (no se borran) para dejar de ofrecerlos en entregas
  nuevas sin perder el historial de las ya hechas.

## Registrar una entrega

Botón **"Registrar Entrega"**:

- **Empleado*** y **Artículo*** (agrupado por categoría).
- **Talle entregado**: si el artículo tiene talle, se **precompleta solo**. Primero busca si el
  empleado tiene un talle adicional cargado para ese artículo exacto (ver "Talles adicionales"
  más abajo); si no, usa el talle básico de su legajo según la categoría (calzado para Calzado,
  remera para Indumentaria alfabética y Protección Manos). Se puede editar igual.
- **Cantidad** y **Fecha de entrega***.
- **Vencimiento**: si el artículo tiene vida útil configurada, se sugiere automáticamente como
  fecha de entrega + esos meses — es editable por si esta entrega puntual necesita otra fecha.
  Tildando **"Sin vencimiento"** la entrega queda sin fecha límite (para artículos que no se
  vencen, o para un caso excepcional).
- **Estado del artículo**: Nuevo, Buen estado o Desgastado.
- **Firma del empleado (opcional)**: se le puede pedir al empleado que firme ahí mismo, con el
  dedo o el mouse, al momento de entregarle el EPP — igual que al pagar un préstamo o un
  adelanto. No es obligatoria. Si se firmó, un ícono de firma en el listado permite verla
  después.

Cada entrega muestra un estado: **Vigente**, **Por vencer**, **Vencido**, **Renovada** o **Sin
vencimiento**.

## Renovación

Cuando a un empleado se le entrega de nuevo el **mismo artículo** y la entrega tiene vencimiento,
la entrega anterior pasa sola a **"Renovada"** — no hay que hacer nada aparte. Esto vale tanto si
la renovación es anticipada (el empleado rompió el pantalón antes de tiempo) como si es porque
venció.

El botón **"Renovar"** (ícono junto a cada entrega vigente) es un atajo: abre el formulario de
entrega con el mismo empleado, artículo y talle ya cargados, solo falta confirmar la fecha.

Los artículos **sin vencimiento** (como los guantes) nunca se reemplazan entre sí: cada entrega
queda como un registro independiente, porque se entregan a demanda y pueden coexistir.

## Aviso de vencimientos en el inicio

Si hay EPP vencido o por vencer, aparece un aviso en la portada del dashboard con el empleado,
el artículo y cuánto falta (o hace cuánto venció). Es informativo — no bloquea nada — y
desaparece solo cuando ya no hay nada vencido ni por vencer. Lo ve únicamente el perfil de
**Gestión de Personal**, aunque otros perfiles tengan acceso al módulo de EPP para registrar
entregas.

## Talles adicionales

El alta/edición de un empleado solo pide los 3 talles básicos (Calzado, Remera, Pantalón). Para
cualquier otro artículo del catálogo — una campera, guantes de soldador, lo que sea — el talle
se agrega desde el **legajo del empleado**, en la card "Talles (EPP)" (pestaña "Información
General"), con el botón **"Agregar talle"**: se elige el artículo y se escribe el talle. Se
puede editar o borrar cada uno por separado; los 3 básicos no se tocan desde ahí.

Un talle adicional, al ser específico de un artículo, tiene prioridad sobre el básico al
precompletar una entrega — así "Guantes de Soldador" y "Guantes de Látex" pueden tener talles
distintos aunque los dos sean "Protección Manos".

<!-- ref: conmomet-app/src/app/dashboard/safety-equipment/page.tsx, conmomet-app/src/app/dashboard/employees/[id]/page.tsx, conmomet-app/src/components/common/EppExpiringAlert.tsx, conmomet-app/src/utils/epp.ts, conmomet-app/src/components/SignaturePad.tsx, conmomet-app/src/components/safety-equipment/EppDeliveriesList.tsx, api_conmomet/models/eppItem.js, api_conmomet/models/safetyEquipment.js, api_conmomet/models/employeeSize.js, api_conmomet/controllers/eppItemController.js, api_conmomet/controllers/safetyEquipmentController.js, api_conmomet/controllers/employeeSizeController.js, api_conmomet/helpers/eppExpiration.js -->
