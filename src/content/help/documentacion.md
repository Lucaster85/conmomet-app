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

## Cargar un documento

Desde la ficha de un Empleado o de un Vehículo, con el botón **"Nuevo Documento"** /
**"Subir Documento"**:

- **Título*** — ej. "Licencia de Conducir", "Examen Médico".
- **Categoría de Documento** (opcional, solo se elige al crear — no se puede cambiar después).
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

## Un aviso importante

Hoy el sistema marca los documentos por vencer o vencidos y los muestra en pantalla (en la
ficha correspondiente y en el widget del Inicio), pero **todavía no manda ningún mail
automático de aviso**. Para enterarse de un vencimiento, hay que entrar a revisar el Inicio o
las fichas — no hay una notificación que llegue sola por ahora.

## Mis Documentos (Portal del Empleado)

Cada empleado puede ver sus propios documentos desde su Portal, en modo **solo lectura** — no
puede cargar, renovar ni resolver nada desde ahí; eso lo hace siempre alguien de administración
desde el Dashboard.

<!-- ref: api_conmomet/controllers/documentController.js, api_conmomet/controllers/documentCategoryController.js, api_conmomet/controllers/cronController.js, api_conmomet/models/entityDocument.js, api_conmomet/models/documentCategory.js, conmomet-app/src/app/dashboard/employees/[id]/page.tsx, conmomet-app/src/app/dashboard/vehicles/VehicleDocumentsDialog.tsx, conmomet-app/src/app/dashboard/page.tsx, conmomet-app/src/app/dashboard/document-categories/page.tsx, conmomet-app/src/app/portal/documents/page.tsx -->
