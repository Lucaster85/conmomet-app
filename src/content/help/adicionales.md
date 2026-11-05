## ¿Qué es un adicional?

Un **adicional** es un **trabajo urgente** que arranca sin pedido de cotización y sin presupuesto
aprobado: no hay tiempo de armar y aprobar un presupuesto antes de empezar. Se empieza a trabajar y a
cargar horas ya, y el presupuesto se presenta después. Es un **proyecto propio**, que puede tener o no
un **proyecto padre**. Se gestiona desde **Gestión de Clientes → Adicionales**.

## Crear un adicional

Con el botón **"Nuevo adicional"** del listado:

- **Nombre*** y **Cliente***.
- **Adicional de** (opcional): el proyecto padre. Viene **vacío**; si lo elegís, el cliente y la planta se
  toman del padre. Solo se ofrecen proyectos del cliente elegido.
- **Planta**, **Descripción**, **Fecha de inicio** (hoy por defecto) y **Moneda** del presupuesto.

Otro camino: desde la pestaña **Adicionales** de un proyecto, el botón **"Nuevo Adicional"** abre el
mismo alta con ese proyecto **ya puesto como padre** (es un atajo).

Al crearlo, el sistema genera **en el acto** el **proyecto** (activo, listo para cargar horas) y su
**presupuesto en borrador** (sin líneas, con el mismo nombre y descripción). Desde Presupuestos ya
**no** se crean adicionales: la opción "Es un adicional de…" no existe más para presupuestos nuevos.

## El código: A-AAAA-NNN

Todos los adicionales nuevos reciben un código **A-AAAA-NNN** (por ejemplo **A-2026-001**), con su
propia numeración por año, separada de la de los proyectos (P-…). Cuando tiene padre se ve así:
**A-2026-001 ↳ P-2026-063** — el código principal es el del adicional y, después de la flecha, el del
padre.

**El código no cambia nunca**, aunque después le asignes, cambies o quites el padre: lo que cambia es
solo la relación que se muestra. Los adicionales anteriores a esta función conservan su código
(**P-2026-063.1**) y aparecen igual en este listado.

## Asignar, cambiar o quitar el proyecto padre

En cualquier momento, desde **Datos generales** del adicional. El padre tiene que ser un proyecto
**normal** (no otro adicional), **raíz** y del **mismo cliente**. Las horas ya cargadas se
**consolidan** en el nuevo padre automáticamente (y dejan de sumar en el anterior).

## Cargar horas

Un adicional aparece en **Carga de Horas** como cualquier otro proyecto, con el formato
**A-2026-001 · nombre (adicional de P-2026-063)**. En su ficha se ve el total de horas consumidas, con
accesos para ir a cargar horas o al proyecto completo.

## Cargar materiales

En la sección **Materiales** del adicional se cargan **material, cantidad, unidad, proveedor** y —con
permiso para ver costos— el **costo real**. Los materiales **viven en el presupuesto** del adicional.
**No se carga ni se ve el margen ni el precio al cliente**: eso lo define quien arma el presupuesto, y
si ya cargó un margen, **se conserva** al editar cantidades desde acá. Los materiales nuevos nacen con
margen 0.

Desde esa misma sección se puede **crear un material o un proveedor** nuevo al vuelo (con "Agregar…").

## Seguimiento del adicional

En la ficha del adicional hay una sección **Seguimiento** para ir dejando notas de seguimiento con fecha ("se compró
material para…", "se hizo…"), con fotos opcionales. Es el seguimiento del proyecto del adicional y se puede cargar
desde el celular. Ver el tema **Seguimiento de proyectos y adicionales**.

## Notificar la finalización

Cuando el trabajo del adicional terminó, hay que avisarle a **gerencia** para que cargue los márgenes y
envíe el presupuesto al cliente. Eso se hace con el botón **"Notificar finalización"**: está en la
columna **Acciones** del listado (ícono de bandera) y en el encabezado de la ficha del adicional.

Al confirmar:

- Elegís **a quién avisar**. Solo se ofrece **gerencia** (quienes pueden enviar presupuestos), podés
  elegir **varias personas** y tiene que haber **al menos una**.
- El adicional pasa a **Completado** y se le pone como fecha de fin la de **hoy** (si no tenía una). Desde
  ese momento **ya no se pueden cargar horas**, y la mano de obra del presupuesto deja de cambiar.
- A cada persona elegida le llega una notificación (campanita y celular) y le aparece la tarjeta
  **"Adicionales para presupuestar"** en la pantalla de inicio. Ver el tema **Avisos del inicio y campanita
  de notificaciones**.
- En la ficha queda escrita la línea **"Finalización notificada el dd/mm a …"**.

El botón se ve con el permiso de modificar adicionales, mientras el adicional **no esté cancelado** y su
presupuesto **siga en borrador**. Si el presupuesto ya se envió, no hay nada que presupuestar y el botón
desaparece.

**Se puede volver a usar** sobre un adicional que ya está Completado: sirve para **cambiar los
responsables**. La lista nueva **reemplaza** a la anterior (no se suma) y se vuelve a avisar a los elegidos.
Con responsables cargados, el ícono del listado cambia de color y su ayuda dice a quién se avisó.

**Cambiar el estado a Completado desde "Datos generales" no avisa a nadie.** Es válido, pero el adicional
queda sin responsables y no aparece en ninguna tarjeta: para avisar a gerencia hay que usar el botón
"Notificar finalización".

## Nombre y descripción compartidos con el presupuesto

Mientras el presupuesto esté en **borrador**, el **nombre** del adicional es el **título** del
presupuesto y la **descripción** es la misma en los dos lugares: editarlos desde cualquiera de los dos
actualiza el otro (también la planta). Cuando el presupuesto se **envía** al cliente queda congelado
—es lo que se le mandó— y el adicional puede seguir editándose sin tocarlo.

## Cuando se envía el presupuesto

Los materiales pasan a **solo lectura** en el adicional (un aviso lo indica). Además, el adicional sale de la
tarjeta **"Adicionales para presupuestar"** de las personas a las que se les había avisado: ya no hay nada
que presupuestar. Quien lo **envía** queda como responsable de conseguir la respuesta del cliente y lo ve
en su tarjeta **"Presupuestos esperando respuesta"** hasta que se carga la aprobación o el rechazo (ver el
tema **Presupuestos**).

## Si el cliente rechaza el presupuesto

- El adicional **sigue activo**: el trabajo y las horas continúan.
- En su ficha aparece un aviso con el **número del presupuesto y el motivo** del rechazo.
- Con el botón **"Nuevo presupuesto"** se crea un **borrador nuevo vinculado al mismo adicional**, que
  parte del rechazado (con sus materiales y mano de obra). Los materiales vuelven a ser editables.
- Hay **un solo presupuesto en curso a la vez**: si ya hay uno que no fue rechazado, no se puede crear
  otro (ni duplicarlo desde Presupuestos).
- Los presupuestos rechazados quedan en el **Historial de presupuestos** del adicional, con su número,
  fecha y motivo.
- No se reabre el rechazado a borrador, para no perder la versión que rechazó el cliente.

Si se aprueba el presupuesto nuevo, **no se crea ningún proyecto nuevo**: el adicional ya es el proyecto.

## Eliminar un adicional

Solo se puede si **no tiene horas cargadas** y su presupuesto **sigue en borrador** (no fue enviado). En
ese caso se eliminan el adicional y su presupuesto. Si ya tiene horas o el presupuesto salió de borrador,
la forma de darlo de baja es cambiar su **estado** a "Cancelado".

## Permisos

El acceso al módulo se asigna con los permisos **additionals_***. Alcanza con ellos para crear
adicionales y cargar materiales, sin necesidad de acceso a Presupuestos ni a Proyectos (esos accesos
solo habilitan los enlaces a esas pantallas). Sin el permiso de costos no se ve el costo real.

El botón **"Notificar finalización"** requiere el permiso de **modificar adicionales**
(**additionals_update**). La lista de personas a las que se puede avisar no pide ningún permiso extra.

<!-- ref: conmomet-app/src/app/dashboard/additionals/page.tsx, conmomet-app/src/app/dashboard/additionals/[id]/page.tsx, conmomet-app/src/utils/projectCode.ts, conmomet-app/src/components/additionals/NotifyFinishDialog.tsx, conmomet-app/src/components/common/AdditionalPendingBudgetAlert.tsx, api_conmomet/controllers/additionalController.js, api_conmomet/services/additionalBudgetService.js, api_conmomet/services/budgetMaterialService.js, api_conmomet/services/projectFactory.js -->
