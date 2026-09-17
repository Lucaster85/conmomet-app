## ¿Qué es una Quincena?

Es el período de liquidación: **1º quincena** (día 1 al 15) y **2º quincena** (día 16 a fin de
mes). Cada quincena pasa por tres estados: **Abierta** (se puede generar/regenerar la
liquidación), **Cerrada** y **Pagada**. Se ubica en **Contabilidad → Quincenas y Pagos**.

## Jornalizados, Mensualizados y Quincenales

Las tres figuras de empleado se liquidan distinto:

- **Jornalizados** (por hora): se liquidan en **cada quincena por separado**, con las horas
  trabajadas de esos 15 días.
- **Mensualizados** (sueldo fijo mensual): se liquidan **una sola vez al mes**, siempre en la
  **2º quincena**, cubriendo el mes completo (sueldo, extras, vacaciones, licencias y faltas de
  todo el mes). Por eso en la 1º quincena no aparecen en el listado de liquidación.
- **Quincenales** (sueldo fijo por quincena): se liquidan en **cada quincena por separado**,
  igual que los jornalizados, pero cobrando siempre el mismo sueldo fijo definido en su tarifa
  (no importa cuántos días tenga esa quincena). Las horas extra, licencias, vacaciones y
  faltas de cada quincena se calculan solo con los datos de esos 15 días.

## Generar la liquidación

Tocar **"Generar"** calcula (o recalcula) la liquidación de cada empleado de la quincena. Se
puede tocar varias veces como vista previa/estimado — **mientras la liquidación de un empleado
siga en Borrador**, cada vez que se genera se recalcula sola con los datos que haya cargados en
ese momento (horas, vacaciones, licencias, faltas). En cuanto se **Confirma**, deja de
recalcularse.

## Qué entra en el cálculo

- **Horas trabajadas** y sus **extras** (50% y 100%).
- **Feriados**: trabajados (se pagan aparte) y no trabajados (se pagan igual, jornada
  estándar).
- **Vacaciones**: se descuentan del período correspondiente y se pagan aparte, con su propia
  tarifa diaria.
- **Licencia médica**: igual criterio que vacaciones — se descuenta y se paga aparte.
- **Faltas injustificadas**: se descuentan. Las faltas **justificadas** solo aplican a
  jornalizados (un mensualizado o quincenal ya está cubierto por su sueldo fijo).

Cada uno de estos ítems se calcula distinto según el empleado sea jornalizado, mensualizado o
quincenal, pero conceptualmente es lo mismo: horas/días trabajados o no trabajados que impactan
el monto final. Mensualizados y quincenales comparten la misma lógica de sueldo fijo — la
diferencia es solo la frecuencia (una vez al mes vs. cada quincena).

## Descuentos automáticos

Al neto de la liquidación se le restan automáticamente:

- **Adelantos**: solo los que ya fueron **efectivamente pagados** (no alcanza con que estén
  aprobados, tienen que estar marcados como pagados). Un adelanto pendiente de pago no se
  descuenta todavía.
- **Cuotas de préstamo** que vencen en ese período.

## Firma y comprobante al marcar un adelanto/préstamo como pagado

Al aprobar, crear con pago inmediato o marcar como pagado un adelanto o un préstamo, además del
método de pago se puede adjuntar el comprobante de la transferencia y/o capturar en pantalla la
firma del empleado (con el dedo o el mouse) como constancia de que recibió el dinero. Por ahora
ninguno de los dos es obligatorio, sin importar el método elegido — quedan disponibles para
usarlos cuando convenga.

La firma y el comprobante guardados quedan disponibles para consultar después desde el listado
de préstamos/adelantos.

## Confirmar y Pagar

Cada liquidación individual pasa por: **Borrador → Confirmada → Pagada**.

- **Confirmada**: deja de recalcularse automáticamente al tocar "Generar" — a partir de acá
  cualquier ajuste se hace a mano.
- **Pagada**: la liquidación queda cerrada, ya no se puede editar (tampoco se le pueden agregar
  o quitar bonos/descuentos manuales). Si algo se liquidó mal, se compensa en la liquidación del
  mes siguiente — no se reabre la ya pagada.

## Firma del recibo de liquidación

Una vez que una liquidación individual queda **Pagada** (ya sea pagándola una por una, o pagando
toda la quincena de una vez desde "Cerrar"/"Pagar" quincena), aparece la acción **"Firmar
recibo"** en el listado y en el detalle. Ahí se puede capturar en pantalla la firma del empleado
(con el dedo o el mouse) como constancia de que recibió su recibo de conformidad. Es opcional y
se puede hacer en el momento de pagar (si el empleado está presente) o más adelante, en cualquier
momento, sobre cualquier liquidación ya pagada. La firma queda guardada e incluida al ver el
detalle o imprimir esa liquidación.

## Adelanto duplicado en la misma quincena

Un empleado puede tener válidamente varios adelantos en la misma quincena — no está prohibido.
Pero al crear un adelanto nuevo desde el backoffice, o al aprobar uno pedido desde el portal, si
el sistema detecta que ese empleado ya tiene otro adelanto (pendiente, aprobado o ya pagado) en
esa misma quincena, se muestra una alerta y hay que confirmar explícitamente "Registrar/Aprobar
igual" para continuar. La comparación es solo contra la quincena actual — no mira adelantos de
quincenas ya cerradas.

## Anular un adelanto ya pagado

Si se cargó un adelanto duplicado por error y ya quedó marcado como pagado, se puede **anular**
desde el listado (no se borra: queda en la tabla con estado "Cancelado", visible activando el
switch **"Ver cancelados"**). Anular un adelanto ya pagado requiere cargar una **justificación
obligatoria**, y genera un aviso en el dashboard visible solo para el rol **Socios Gerentes**, con
el detalle de qué se anuló, por cuánto y por qué (el empleado que lo anuló no ve este aviso). Si
la liquidación de ese empleado para esa quincena ya está Confirmada o Pagada, no se puede anular
el adelanto — hay que esperar a que la corrección se pueda hacer sin tocar una liquidación cerrada.

## Retroactivos de gremio

Si se aplica un aumento de Convenio Colectivo con fecha retroactiva, el sistema agrega
automáticamente líneas de **"Retroactivo"** en la liquidación del período correspondiente, con
la diferencia calculada sobre lo ya liquidado en los períodos anteriores afectados.

<!-- ref: api_conmomet/controllers/loanController.js#markAsPaid, api_conmomet/controllers/salaryAdvanceController.js#markAsPaid, api_conmomet/controllers/salaryAdvanceController.js#delete, api_conmomet/controllers/salaryAdvanceController.js#findDuplicateAdvance, api_conmomet/controllers/salaryAdvanceDeletionAlertController.js, api_conmomet/controllers/payrollController.js#attachSignature, api_conmomet/controllers/payrollAdjustmentController.js, conmomet-app/src/components/SignaturePad.tsx, conmomet-app/src/components/common/SalaryAdvanceDeletionAlert.tsx, conmomet-app/src/app/dashboard/loans/page.tsx, conmomet-app/src/app/dashboard/salary-advances/page.tsx, conmomet-app/src/app/dashboard/pay-periods/[id]/payroll/page.tsx -->
