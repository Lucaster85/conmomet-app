## Qué es un egreso

Un **egreso** es el trámite de dar de baja a un empleado: renuncia, despido o retiro de común acuerdo. Reemplaza el viejo "ponerlo inactivo a mano": el egreso guarda **por qué** se fue, **cuándo**, y los **papeles** que lo respaldan (telegramas, actas, etc.), todo en el legajo del empleado.

> Hoy el egreso cubre el trámite, la documentación y **una propuesta de cálculo de la liquidación** (solo lectura). **Generar y pagar la liquidación final desde el sistema todavía no está**: hasta la próxima etapa, lo que corresponda pagar se paga por fuera.

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

## Cálculo de la liquidación (propuesta)

Con un egreso cargado, la pestaña **Egreso** muestra el **Cálculo de la liquidación**: cuánto le correspondería al empleado y **cómo se llegó a cada número**. Lo ve quien tiene permiso de **ver sueldos**. Es solo de lectura: no genera ni paga nada, y se puede **recalcular** cuando cambian los datos.

> **Es una propuesta.** La Ley 27.802 tiene artículos suspendidos judicialmente (el del preaviso y el del art. 245), y el estado puede cambiar de un mes al otro. El contador tiene que validar cada monto antes de pagar.

### Qué incluye cada tipo

| Concepto | Renuncia | Despido con causa | Despido sin causa | Mutuo acuerdo |
|---|---|---|---|---|
| Haberes del período sin liquidar | Sí | Sí | Sí | Sí |
| SAC proporcional | Sí | Sí | Sí | Sí |
| Vacaciones no gozadas + su SAC | Sí | Sí | Sí | Sí |
| Preaviso + su SAC | — | — | Sí, si no se preavisó | Solo referencia |
| Integración del mes + su SAC | — | — | Sí, si no hubo preaviso y no es fin de mes | Solo referencia |
| Indemnización por antigüedad (art. 245) | — | — | Sí | Solo referencia |
| Gratificación por cese pactada | — | — | — | El monto del acuerdo (etapa siguiente) |
| Descuento de adelantos y préstamos | Sí | Sí | Sí | Sí |

En el **mutuo acuerdo** el preaviso, la integración y el art. 245 se calculan igual que en un despido sin causa, pero **solo para tener una referencia al negociar el monto**: no suman al total.

### Cómo se calcula cada concepto

- **Haberes del período sin liquidar:** desde el día siguiente a la última quincena liquidada hasta el último día de trabajo. Los jornalizados cobran las horas aprobadas de ese tramo. Los mensualizados y los quincenales fijos cobran **sueldo mensual ÷ 30 × días** (más las horas extra aprobadas); un mes completo sin liquidar vale el sueldo entero aunque tenga 31 días. Si la última quincena liquidada termina **después** del egreso (un fijo pagado de más), la línea sale **en negativo** como "Haberes pagados de más".
- **SAC proporcional:** mejor mes del semestre ÷ 2 × días del semestre trabajados hasta el egreso ÷ días del semestre. Cuenta los haberes del tramo sin liquidar. Si el egreso es en **enero o julio** y el aguinaldo del semestre anterior todavía no se liquidó, se suma ese SAC aparte.
- **Vacaciones no gozadas:** días que corresponden por antigüedad × días trabajados del año ÷ 365 − días ya gozados en el año (nunca da negativo), por el valor del día: **sueldo ÷ 25** en los fijos, **8 horas × valor hora** en los jornalizados. Lleva su SAC (monto ÷ 12).
- **Base de la indemnización:** el **mejor mes de los últimos 12**. No entran el aguinaldo, las diferencias de aguinaldo, las vacaciones ni los premios no remunerativos. La pantalla muestra los 12 meses y marca el elegido.
- **Antigüedad:** cuenta el último día trabajado. Para el art. 245, una fracción **mayor a 3 meses** suma un año.
- **Preaviso:** 1 mes de base hasta 5 años de antigüedad, 2 meses si es más. Con preaviso parcial se paga la parte no otorgada, en proporción a los días (hace falta cargar las fechas del preaviso). No corresponde en el período de prueba (los primeros 6 meses).
- **Integración del mes:** base ÷ días del mes × días que faltan hasta fin de mes. Solo si no hubo preaviso y el egreso no es el último día del mes.
- **Indemnización por antigüedad (art. 245):** base × años (con el tope del convenio, si se cargó), con un **mínimo de 1 mes de sueldo**. En el período de prueba no corresponde. Lleva SAC solo el preaviso y la integración.

### Ejemplos

Empleado mensualizado de $900.000, ingresó el 01/03/2020, egresa el 20/10/2026 (6 años, 7 meses y 20 días; 7 años para el art. 245). Su mejor mes de los últimos 12 fue de $1.000.000, tomó 7 de sus 21 días de vacaciones del año y la última quincena liquidada terminó el 30/09.

- **Renuncia:** haberes del 1 al 20/10 ($900.000 ÷ 30 × 20) $600.000 + SAC proporcional ($1.000.000 ÷ 2 × 112/184) $304.347,83 + vacaciones no gozadas (21 × 293/365 − 7 = 9,86 días × $36.000) $354.960 + su SAC $29.580 = **$1.288.887,83**.
- **Despido sin causa, sin preaviso:** lo mismo de la renuncia, **más** preaviso (2 meses por tener más de 5 años) $2.000.000 + su SAC $166.666,67, integración (11 de 31 días) $354.838,71 + su SAC $29.569,89 y art. 245 (7 años × $1.000.000) $7.000.000 = **$10.839.963,10** brutos.
- **Despido con causa:** igual que la renuncia ($1.288.887,83): no hay preaviso ni indemnización.
- **Mutuo acuerdo:** lo mismo de la renuncia más lo que se pacte. La pantalla muestra los $9.551.075,27 del preaviso, la integración y el art. 245 como referencia para negociar.

### Descuentos

Se listan los **adelantos pagados que todavía no se descontaron** en una liquidación y los **préstamos activos**. De los préstamos de cuota fija se cobra la cuota que está corriendo completa y de las que faltan **solo el capital** (el interés se perdona). Los préstamos en dólares se convierten a pesos con la cotización al generar la liquidación final. Si los descuentos superan lo que se le debe, el neto estimado queda en $0 y se avisa la deuda que quedaría.

También avisa si hay **pedidos de adelanto sin resolver** o **préstamos pedidos o aprobados sin entregar**, que conviene cerrar antes de liquidar.

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

<!-- ref: api_conmomet/controllers/employeeTerminationController.js, api_conmomet/helpers/terminationRules.js, api_conmomet/services/terminationGuards.js, api_conmomet/helpers/terminationCalculations.js, api_conmomet/services/terminationCalculationService.js, api_conmomet/services/loanSettlement.js, conmomet-app/src/components/employees/TerminationCalculationCard.tsx, api_conmomet/models/employeeTermination.js, conmomet-app/src/components/employees/EmployeeTerminationPanel.tsx, conmomet-app/src/components/employees/TerminationFormDialog.tsx, conmomet-app/src/app/dashboard/employees/[id]/page.tsx, conmomet-app/src/app/dashboard/employees/page.tsx -->
