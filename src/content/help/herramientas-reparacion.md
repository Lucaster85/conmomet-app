## ¿Cuándo hace falta un responsable de reparación?

Cuando una herramienta pasa a estado **"En reparación"** — ya sea manualmente desde su ficha
("Cambiar estado") o automáticamente al registrar una **devolución** con "Estado resultante: En
reparación" — el sistema pide elegir un **responsable**. Es la persona que se va a encargar (o
va a estar al tanto) de que la herramienta se repare.

## Quién puede ser responsable

Solo empleados que tengan **usuario del sistema vinculado** (pueden loguearse a la app). Si un
empleado no tiene cuenta, no va a poder enterarse del aviso por este medio, así que directamente
no aparece como opción en el selector.

## Cómo se entera el responsable

No hay una campanita de notificaciones en el sistema (todavía) — el aviso es un cartel simple que
aparece apenas el responsable entra a la app, en la pantalla de inicio:

- Si tiene acceso al **panel** (dashboard), lo ve ahí.
- Si solo tiene acceso al **portal** de autoservicio, lo ve ahí.
- Si tiene ambos, lo ve en cualquiera de los dos.

El aviso lista todas las herramientas en reparación asignadas a esa persona, y desaparece solo
cuando alguien cambia la herramienta de estado (por ejemplo, a "Disponible" una vez arreglada).

## Reasignar el responsable

Si hace falta cambiar quién está a cargo de una reparación en curso, alcanza con volver a usar
"Cambiar estado" en la ficha de la herramienta, elegir de nuevo "En reparación" y seleccionar otro
responsable.

<!-- ref: api_conmomet/controllers/toolController.js#changeStatus, api_conmomet/controllers/assetAssignmentController.js#returnAssignment, api_conmomet/controllers/selfServiceController.js#getMyToolsInRepair, conmomet-app/src/components/common/RepairToolsAlert.tsx -->
