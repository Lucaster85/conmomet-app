## ¿Qué es el módulo de Clientes?

Es donde se gestionan los clientes de la empresa. Se ubica en **Gestión de Clientes →
Clientes**. Desde la ficha de cada cliente también se administran sus **Supervisores** y sus
**Tarifas por Rubro** (ver más abajo).

## Alta y edición de un cliente

Con el botón **"Nuevo Cliente"**, solo tres campos:

- **Razón Social*** (obligatorio).
- **Email*** (obligatorio, con formato válido).
- **Teléfono** (opcional).

## Desactivar un cliente

El ícono de activar/desactivar en el listado **nunca borra** al cliente, solo cambia si está
activo. Un cliente **inactivo** simplemente deja de aparecer como opción en los selectores de
otros módulos (OCAs, Presupuestos, Proyectos, Plantas) — se puede reactivar en cualquier
momento desde el mismo listado, sin perder nada de su historial.

## Supervisores del Cliente

Se crean y editan desde la ficha del cliente (ícono **"Supervisores"**) — no tienen una página
propia en el menú. Campos:

- **Nombre*** y **Apellido*** (obligatorios).
- **Email**, **Teléfono** (opcionales).
- **Tipo de contacto**: **Obra** o **Administración**. Es solo una convención para saber quién
  hace qué: el contacto de **Obra** es quien aprueba los remitos/OCAs (ver el tema **Creación
  de OCAs**); el de **Administración** es quien aprueba el Presupuesto (ver el tema
  **Presupuestos**). El sistema no impide elegir cualquiera de los dos en cualquiera de esas dos
  aprobaciones — es una guía, no una restricción dura.
- Switch **Activo/Inactivo**.
- A diferencia del cliente, un supervisor **sí se puede eliminar** de verdad (con confirmación).

**Dónde se usan**: un supervisor no se asigna a un proyecto desde acá. Se crea acá (queda
asociado al cliente), y **se asigna a un Proyecto puntual desde la ficha de ese Proyecto**
(sección "Asignación de Supervisores" — ver el tema **Proyectos**). Si un cliente todavía no
tiene ningún supervisor cargado, esa sección del proyecto lo va a avisar y va a pedir cargarlos
acá primero.

## Tarifas por Rubro

Ícono **"Tarifas por rubro"** en la ficha del cliente (solo visible si tenés permiso para ver
precios de presupuestos). Es la tarifa de mano de obra que ese cliente en particular paga por
cada rubro (ej. "Hs Grúa"), y sirve como **valor sugerido al armar un Presupuesto** para ese
cliente — el valor sigue siendo editable línea por línea, esto es solo el punto de partida.

No hace falta cargarlas siempre a mano acá: **se actualizan solas** cada vez que alguien edita
el valor unitario de una línea de mano de obra en un Presupuesto de ese cliente (incluso en
borrador). Este diálogo es la forma de **verlas y corregirlas** manualmente, y tiene un botón
**"Historial"** con el registro de todos los cambios (monto, moneda, fecha y quién lo hizo) —
es un historial que no se puede borrar.

Es un concepto totalmente aparte de la tarifa que se carga en una OCA de Horas Hombre — son dos
precios independientes que no se mezclan.

<!-- ref: conmomet-app/src/app/dashboard/clients/page.tsx, conmomet-app/src/app/dashboard/clients/ClientForm.tsx, conmomet-app/src/app/dashboard/clients/ClientSupervisorsDialog.tsx, conmomet-app/src/app/dashboard/clients/ClientItemRatesDialog.tsx, api_conmomet/controllers/clientController.js, api_conmomet/controllers/clientSupervisorController.js, api_conmomet/controllers/clientItemRateController.js -->
