## ¿Qué es Documentación y Vencimientos?

Es la forma en que se gestionan los documentos de la empresa que tienen (o no) fecha de
vencimiento: ART, VTV, seguros, carnets, certificaciones, etc. **No tiene un menú propio** —
es transversal, se usa exactamente igual dentro de la ficha de **Empleados** (pestaña
"Documentos y Vencimientos", también llamado "Legajo Virtual") y de **Vehículos** ("Legajo
Digital"). Todo lo que esté por vencer o vencido, de cualquier empleado o vehículo, se ve
junto en un solo lugar: el widget **"Alertas de Vencimientos"** del **Inicio**.

## Categorías de Documento

Es el catálogo de "tipos" de documento (ej. "ART", "Curso de Altura", "VTV"), se administra en
**Configuración → Categorías de Documentos**:

- **Nombre*** — ej. "Inducción de Seguridad", "Examen Médico".
- **Descripción**.
- **"Aplica a"*** — Empleados, Vehículos, Proyectos o Empresa.
- **"Específico de Planta"** (switch): si está activo, al cargar un documento de esa categoría
  se va a pedir además indicar a qué planta corresponde (ej. una habilitación que solo vale
  para una obra puntual). Si está apagado, aplica en general (ej. ART, licencia de conducir).

**Importante**: la categoría en sí **no define si un documento es obligatorio**. Eso se
configura aparte, por planta, en **Requisitos** (ver el tema **Plantas**) — la categoría es
solo el catálogo de tipos, la obligatoriedad es una regla de cada planta.

### Crear y gestionar categorías sin salir del legajo

Al cargar un documento desde la ficha de un Empleado o de un Vehículo no hace falta ir a
Configuración si la categoría no existe:

- **Crear sobre la marcha**: en el selector de categoría escribí el nombre; si no existe aparece
  **"Agregar «nombre»"** al final de la lista. Al tocarlo se crea y queda elegida. La categoría
  se crea para el tipo de legajo en el que estás (Empleados o Vehículos).
- **Gestionar categorías**: el botón de ajustes al lado del selector abre una lista donde se
  puede agregar, renombrar y eliminar categorías. En Empleados también se puede marcar cada una
  como **"Específica de planta"**. La descripción y el resto de los datos se siguen editando en
  **Configuración → Categorías de Documentos**.
- **Permisos**: "Agregar" y el botón de gestionar solo aparecen si tu rol tiene permisos sobre
  Categorías de Documentos (crear, editar o eliminar); cada acción exige el suyo.
- **No se puede eliminar una categoría en uso**: si tiene documentos cargados o está como
  requisito de una planta, el sistema avisa y la categoría se mantiene.

## Cargar un documento

Desde la ficha de un Empleado o de un Vehículo, con el botón **"Nuevo Documento"** /
**"Subir Documento"**:

- **Título*** — ej. "Licencia de Conducir", "Examen Médico".
- **Categoría de Documento** (opcional, solo se elige al crear — no se puede cambiar después).
  Si la categoría no existe, se puede crear desde el mismo selector (ver "Crear y gestionar
  categorías sin salir del legajo").
- **Planta Destino** — solo aparece si la categoría elegida es "Específica de Planta".
- Switch **"Este documento tiene fecha de vencimiento"** — si se activa:
  - Switch **"Este documento se renueva"** (define si más adelante se puede **Renovar** o solo
    **Resolver**, ver abajo).
  - **Fecha de Vencimiento***.
  - **"Avisar días antes"** — cuántos días antes del vencimiento se considera "Vence Pronto".
- **Notas adicionales**.
- **Archivo adjunto** (opcional al cargar, se puede agregar después).

## Los estados

- **Permanente** (gris): no tiene fecha de vencimiento.
- **Al Día** (verde): vigente, todavía lejos del vencimiento.
- **Vence Pronto** (amarillo): está dentro de la ventana de aviso que se cargó ("Avisar días
  antes").
- **Vencido** (rojo): ya pasó la fecha.
- **Resuelto** (gris): ya se renovó o se resolvió, queda como historial.

El umbral de "Vence Pronto" **no es un número fijo para toda la app** — es el que se cargó en
"Avisar días antes" para ese documento en particular (por defecto, 15 días).

## Renovar vs. Resolver

Cuando un documento está en **Vence Pronto** o **Vencido**, aparece una de estas dos acciones
(según si el documento "se renueva" o no):

- **Renovar** (documentos renovables, ej. una licencia o un seguro): pide una **nueva fecha de
  vencimiento** y un **archivo nuevo, obligatorio**. El documento anterior no se borra: queda
  guardado como historial, y el nuevo pasa a ser la versión vigente.
- **Resolver** (documentos que no se renuevan, ej. una multa que se pagó): pide solo un
  **comprobante obligatorio**. Cierra el mismo registro (no crea una versión nueva) y no pide
  ninguna fecha — es para trámites puntuales que ya no van a volver a vencer.

## Historial de versiones

Si un documento ya se renovó alguna vez, aparece el ícono **"Ver Historial"**, con todas las
versiones anteriores (vencimiento, estado, cuándo se resolvió, y su archivo).

## Alertas de Vencimientos (Inicio)

Es el panel único para ver todo lo que está por vencer o vencido, de cualquier empleado o
vehículo, sin tener que entrar módulo por módulo. Desde ahí mismo se puede **Renovar** o
**Resolver** directamente, igual que desde la ficha de origen.

Cada alerta tiene además dos botones para ir al detalle:

- **Ver detalle**: lleva directo a la ficha de origen del documento — en empleados, abre la
  ficha ya en la pestaña "Documentos y Vencimientos"; en vehículos, abre el "Legajo Digital" de
  ese vehículo. En ambos casos el documento que generó la alerta queda resaltado en la lista.
  Solo aparece si el usuario tiene permiso de lectura sobre ese módulo (empleados o vehículos).
- **Ver archivo**: abre directamente el archivo adjunto (PDF o imagen) en una pestaña nueva, sin
  pasar por la ficha. Solo aparece si el documento tiene un archivo cargado.

## Un aviso importante

Hoy el sistema marca los documentos por vencer o vencidos y los muestra en pantalla (en la
ficha correspondiente y en el aviso del Inicio), pero **todavía no manda ningún mail ni
notificación automática de aviso**. Para enterarse de un vencimiento, hay que entrar a revisar el
Inicio o las fichas — **no se manda ningún mail**.

Lo que sí hay: cuando alguien entra al sistema, los documentos por vencer y vencidos generan una
**notificación en la campanita** del header (y un aviso al celular, si lo tenés activado) para
quien tenga permiso de Documentación. Aparece la próxima vez que alguien entra, no a una hora
fija. Ver el tema **Avisos del inicio y campanita de notificaciones**.

En el aviso del Inicio, los documentos que ya revisaste se pueden **marcar como vistos** con el
ojito, para que la lista no tape el resto de la pantalla. El contador de arriba sigue mostrando
cuántos hay en total, y un documento que pasa de "por vencer" a "vencido" (o que se renueva con
otra fecha) vuelve a aparecer solo. Ver el tema **Avisos del inicio y campanita de notificaciones**.

## Documentos del egreso de un empleado

Cuando se da de baja a un empleado, los papeles del trámite (telegrama de renuncia, carta documento, acta de mutuo acuerdo, etc.) se cargan desde la pestaña **Egreso** de su ficha, con categorías propias ya cargadas. Esos documentos **también aparecen en "Documentos y Vencimientos"** del empleado, como cualquier otro, pero sin fecha de vencimiento ni renovación. Ver el tema **Egresos de empleados**.

## Mis Documentos (Portal del Empleado)

Cada empleado puede ver sus propios documentos desde su Portal, en modo **solo lectura** — no
puede cargar, renovar ni resolver nada desde ahí; eso lo hace siempre alguien de administración
desde el Dashboard.

<!-- ref: api_conmomet/controllers/documentController.js, api_conmomet/controllers/documentCategoryController.js, api_conmomet/controllers/cronController.js, api_conmomet/models/entityDocument.js, api_conmomet/models/documentCategory.js, api_conmomet/controllers/employeeTerminationController.js, conmomet-app/src/app/dashboard/employees/[id]/page.tsx, conmomet-app/src/app/dashboard/vehicles/VehicleDocumentsDialog.tsx, conmomet-app/src/components/documents/*, conmomet-app/src/app/dashboard/page.tsx, conmomet-app/src/app/dashboard/document-categories/page.tsx, conmomet-app/src/app/portal/documents/page.tsx -->
