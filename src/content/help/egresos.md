## Qué es un egreso

Un **egreso** es el trámite de dar de baja a un empleado: renuncia, despido o retiro de común acuerdo. Reemplaza el viejo "ponerlo inactivo a mano": el egreso guarda **por qué** se fue, **cuándo**, y los **papeles** que lo respaldan (telegramas, actas, etc.), todo en el legajo del empleado.

> Por ahora el egreso cubre el trámite y la documentación. **El cálculo de la liquidación final** (haberes del período, aguinaldo y vacaciones proporcionales, indemnización) **todavía no está en el sistema**: se hace por fuera hasta la próxima etapa.

## Los cuatro tipos

- **Renuncia** (art. 240): el empleado renuncia. Solo es válida por **telegrama** o ante autoridad, así que conviene cargar el telegrama. Si el empleado no dio los 15 días de preaviso, se puede dejar marcado.
- **Despido con causa** (art. 242): la empresa despide por una causa que tiene que estar **por escrito** en la comunicación (carta documento o telegrama) y no se puede cambiar después. La causa es obligatoria.
- **Despido sin causa** (art. 245): corresponde indemnización. Se indica si la empresa dio **preaviso** (completo o parcial) y, si lo conocés, el **tope del convenio** (3 × el promedio del convenio aplicable).
- **Mutuo acuerdo** (art. 241): retiro voluntario. Tiene que formalizarse por **escritura pública** o ante autoridad, con el empleado presente. Se carga el acta o escritura.

## Cómo dar de baja a un empleado

1. Entrá a **Personal → Empleados** y abrí la ficha del empleado.
2. Tocá **Dar de baja** (arriba a la derecha). Solo aparece si tenés permiso y el empleado no tiene ya un egreso en curso.
3. Seguí los pasos: **tipo** → **fechas y preaviso** → **causa y notas** → **documentos** (opcional, se pueden cargar después) → **resumen**.
4. El egreso queda como **Borrador**. Aparece la pestaña **Egreso** en la ficha, y un chip "Egreso en curso" en el listado.

## Los estados

- **Borrador:** el egreso está cargado pero **el empleado sigue activo** y se liquida con normalidad. Sirve, por ejemplo, para cargar el telegrama de una renuncia mientras el empleado trabaja el preaviso. Se puede editar.
- **Confirmado:** el empleado pasa a **inactivo** con su fecha de egreso. A partir de ahí el sistema no deja cargarle **horas posteriores** a esa fecha, **adelantos** ni **préstamos** (tampoco pedirlos desde su portal), y deja de entrar en las quincenas.
- **Liquidado:** la liquidación final ya se pagó. *(Etapa siguiente.)*
- **Anulado:** se canceló el egreso.

### Confirmar

Se confirma desde la pestaña **Egreso**, con el botón **Confirmar egreso**. El sistema no deja confirmar si:

- **La fecha de egreso todavía no llegó.** Confirmá a partir de esa fecha; hasta entonces el empleado sigue activo y cobra normal.
- **Hay una liquidación en borrador** de una quincena que llega hasta la fecha de egreso. Eliminala antes: los haberes hasta el último día se pagan en la liquidación final y, si no, se pagarían dos veces.

### Anular

**Anular egreso** pide un **motivo** (queda registrado). Si el egreso estaba confirmado, el empleado **vuelve a estar activo** y se borra la fecha de egreso. Sirve para una renuncia retractada o un egreso cargado por error. Los documentos quedan en el legajo. No se puede anular un egreso ya liquidado y pagado.

Después de anular se puede cargar un egreso nuevo.

> Mientras haya un egreso en curso, el **estado** del empleado y su **fecha de egreso** no se pueden cambiar a mano desde el formulario del empleado: se modifican solo desde el egreso.

## Documentos del egreso

En la pestaña **Egreso** → **Cargar documento** se suben los papeles del trámite, con título, categoría y notas. Se pueden cargar en **cualquier estado**, incluso con el egreso anulado o liquidado (los papeles de un juicio llegan meses después). Cada documento también aparece en la pestaña **Documentos y Vencimientos** del empleado, sin fecha de vencimiento.

Qué conviene cargar en cada caso:

| Tipo | Documento clave |
|---|---|
| Renuncia | Telegrama de renuncia |
| Despido con causa | Telegrama / carta documento de despido, y las pruebas y el descargo del empleado si los hay |
| Despido sin causa | Telegrama / carta documento de despido |
| Mutuo acuerdo | Acta o escritura de mutuo acuerdo |

Las categorías de documento (Telegrama de renuncia, Telegrama / carta documento de despido, Prueba, Descargo del empleado, Acta / escritura de mutuo acuerdo, Acuerdo / convenio de pago, Recibo de liquidación final firmado, Certificado de trabajo (art. 80), Otro (egreso)) ya vienen cargadas y se pueden editar desde **Categorías de Documento**. Los avisos de "documento faltante" reconocen la categoría por su nombre: si la renombrás, el aviso deja de verla.

## Plazos y avisos

El sistema muestra avisos en la pestaña **Egreso**. **Ninguno bloquea nada**, son recordatorios:

- Renuncia sin telegrama cargado.
- Despido con causa sin telegrama / carta documento.
- Mutuo acuerdo sin acta o escritura.
- **Certificado de trabajo (art. 80):** tiene que entregarse dentro de los **30 días** del egreso. Con el egreso confirmado, la pestaña muestra hasta cuándo y permite **marcar la entrega** con su fecha; pasado el plazo sin entregarlo, aparece el aviso.
- **Pago de la liquidación final:** la ley fija **4 días hábiles** desde el egreso. La pestaña muestra la fecha límite (sin contar fines de semana ni feriados cargados).

## Quién puede hacer qué

- **Ver egresos:** permiso *Egresos de empleados — lectura*.
- **Cargar, editar, subir y borrar documentos:** *escritura*.
- **Confirmar y anular:** permiso aparte, *confirmar*. Conviene dárselo solo a quien decide la baja.

El tope del convenio es un monto: solo lo ve quien tiene el permiso de **ver sueldos**.

<!-- ref: api_conmomet/controllers/employeeTerminationController.js, api_conmomet/helpers/terminationRules.js, api_conmomet/services/terminationGuards.js, api_conmomet/models/employeeTermination.js, conmomet-app/src/components/employees/EmployeeTerminationPanel.tsx, conmomet-app/src/components/employees/TerminationFormDialog.tsx, conmomet-app/src/app/dashboard/employees/[id]/page.tsx, conmomet-app/src/app/dashboard/employees/page.tsx -->
