## ¿Qué es una Quincena?

Es el período de liquidación: **1º quincena** (día 1 al 15) y **2º quincena** (día 16 a fin de
mes). Cada quincena pasa por tres estados: **Abierta** (se puede generar/regenerar la
liquidación), **Cerrada** y **Pagada**. Se ubica en **Contabilidad → Quincenas y Pagos**.

Además de las quincenas, en junio y diciembre aparece una liquidación aparte: el **Aguinaldo
(SAC)** del semestre (ver "Aguinaldo (SAC)" más abajo).

Un empleado dado de baja **ya no entra en las quincenas**: desde que se confirma su egreso queda inactivo y todo lo que le corresponde (haberes hasta el último día, aguinaldo, vacaciones, indemnización) se paga en su **liquidación final**, que vive aparte (ver "Liquidación final" más abajo).

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

## Buscar un empleado en el listado

Arriba de la lista de la quincena hay una barra de búsqueda por **nombre o apellido** del
empleado. Funciona con cualquier parte del nombre, sin importar mayúsculas ni tildes, y con
varias palabras a la vez ("juan perez" encuentra a "Pérez, Juan"). **"Limpiar filtros"** vuelve
a mostrar a todos.

Ojo: **Imprimir**, **Imprimir Detalles**, **Exportar Horas** y **Exportar Planilla** trabajan sobre lo que está
filtrado en pantalla. Si buscaste a un empleado y tocás alguno de esos botones, sale solo ese
empleado; para sacar la quincena completa, limpiá el filtro antes.

## Recibo / Depósito y la planilla de la quincena

Además de **Premio / Extra** y **Descuento**, en **Gestión de ajustes** hay un tercer tipo:
**Recibo / Depósito**. Sirve para registrar la parte del sueldo que se paga por depósito (o con
recibo) en vez de en efectivo. **Resta del neto igual que un descuento**, así que el **Sueldo
Neto** pasa a ser lo que se le paga al empleado en efectivo. En el listado tiene su propia
columna **Depósito**, y en el detalle y el recibo aparece como línea aparte
("Recibo / Depósito (descripción)"), separada de las retenciones. El empleado también lo ve en su
portal.

El botón **Exportar Planilla** baja un Excel con una fila por empleado (APELLIDO, Nombre) y estas
columnas:

- **QUINCENA**: el total de la quincena, con premios y sin descuentos (el sueldo bruto).
- **DESCUENTOS**: adelantos + cuotas de préstamo (tanto las cuotas fijas como las descontadas a
  discreción) + los ajustes de tipo Descuento.
- **DEPOSITO**: los ajustes de tipo Recibo / Depósito.
- **EFECTIVO**: lo que se cobra en mano = Quincena − Descuentos − Depósito.

Al final hay una fila de totales con la suma de cada columna.

## Premios no remunerativos

Un **Premio / Extra** puede marcarse como **No remunerativo**: se paga igual y suma al bruto y al
neto de la quincena, pero **no cuenta para el aguinaldo (SAC)**. El caso típico son los viáticos.

- **Al cargarlo:** en **Gestión de ajustes**, al elegir **Premio / Extra** aparece el casillero
  **"No remunerativo (no suma para el aguinaldo)"**.
- **Ya cargado:** en la tabla de ajustes registrados, cada premio tiene un interruptor para
  marcarlo o desmarcarlo, y los no remunerativos muestran la etiqueta **No remunerativo**.
- **La suma no remunerativa por categoría** (el botón de aplicar a toda una categoría de
  gremio) ya se carga marcada como no remunerativa.
- **Solo se puede cambiar con la liquidación en borrador**, igual que el resto de los ajustes. Si
  hace falta corregir un premio de una quincena ya confirmada o pagada, pedíselo al
  administrador del sistema.
- Los premios que ya estaban cargados antes de esta función **quedan como remunerativos**: si
  alguno no lo es, hay que marcarlo a mano.

## Qué entra en el cálculo

- **Horas trabajadas** y sus **extras** (50% y 100%).
- **Feriados**: trabajados (se pagan aparte) y no trabajados (se pagan igual, jornada
  estándar).
- **Vacaciones**: se descuentan del período correspondiente y se pagan aparte, con su propia
  tarifa diaria.
- **Licencia médica**: igual criterio que vacaciones — se descuenta y se paga aparte.
- **Faltas injustificadas**: se descuentan. Las faltas **justificadas** solo aplican a
  jornalizados (un mensualizado o quincenal ya está cubierto por su sueldo fijo).
- **Aguinaldo (SAC)**: no es parte de ninguna quincena, se liquida aparte (ver abajo).

Cada uno de estos ítems se calcula distinto según el empleado sea jornalizado, mensualizado o
quincenal, pero conceptualmente es lo mismo: horas/días trabajados o no trabajados que impactan
el monto final. Mensualizados y quincenales comparten la misma lógica de sueldo fijo — la
diferencia es solo la frecuencia (una vez al mes vs. cada quincena).

## Aguinaldo (SAC)

El **Sueldo Anual Complementario** se paga dos veces por año, por semestre (enero–junio y
julio–diciembre). Se liquida como una card más en **Quincenas y Pagos**, llamada **"Aguinaldo
(SAC) 1er/2do semestre"**, al lado de las quincenas.

**Cuándo aparece:** sola, en el momento en que se abre la **2ª quincena de junio o de diciembre**.
Si esa 2ª quincena ya estaba abierta de antes, la card de la quincena muestra un botón **Crear
aguinaldo**. El botón **Generar Aguinaldo** se habilita recién desde el **día 16** (cuando empieza
esa 2ª quincena). Se genera, se regenera mientras esté en borrador, se confirma y se paga igual
que una quincena. La card avisa el vencimiento legal (30/06 y 18/12, más 4 días hábiles), solo
como recordatorio: no bloquea nada.

**Cómo se calcula:**

- Es la **mitad de la mejor remuneración mensual del semestre**: de los seis meses se toma el de
  mayor total (las dos quincenas sumadas en jornalizados y quincenales; la liquidación del mes en
  mensualizados) y se divide por 2.
- Si el empleado **ingresó durante el semestre**, es proporcional a los días desde su ingreso
  sobre los días del semestre.
- Solo cuentan las liquidaciones **confirmadas o pagadas**. Las faltas, licencias y vacaciones no
  se tratan aparte: ya están reflejadas en lo que cobró cada mes.
- Los premios **no remunerativos** (ver "Premios no remunerativos") **no suman**, y tampoco
  cuenta lo que se le cargue al propio aguinaldo.
- Un **retroactivo** cuenta en el mes al que corresponde, no en el que se cobró.
- Todo es **bruto**: no se calculan cargas sociales.

**Control antes de pagar:** el ícono de calculadora de cada empleado muestra el desglose — el mes
elegido, los días computables y los premios del semestre que cuentan y los excluidos por ser no
remunerativos. Es solo para el personal administrativo: el recibo y el portal del empleado
muestran la línea "SAC 1er semestre 2026", los premios, descuentos, depósito y el neto, sin el
desglose. Si un premio quedó mal marcado, corregilo en la quincena en borrador y volvé a
generar. Una etiqueta **Desactualizado** indica que el cálculo cambió desde que se generó.

**Premios, descuentos y depósito** se cargan con **Ajustes**, igual que en una quincena. Los
**adelantos y los préstamos nunca se descuentan del aguinaldo**. En el **Resumen de costos**, el
aguinaldo cuenta en junio o diciembre, en su propio renglón.

### Diferencias de aguinaldo

El aguinaldo ya liquidado no se vuelve a calcular solo. Si después resulta que correspondía más,
el sistema suma la **diferencia** en una línea **"Diferencia SAC 1er/2do sem. AAAA"** dentro de
una quincena posterior, en esa misma liquidación (se ve en el detalle y entra en el bruto y en el
Resumen de costos del mes en que se paga). **Solo se paga la diferencia a favor del empleado**: si
el aguinaldo estaba bien o se había pagado de más, no se hace nada. Pasa por dos motivos:

- **Se liquidó el aguinaldo antes de que cerrara la 2ª quincena de junio/diciembre.** Si ese mes
  terminó siendo el mejor, el aguinaldo quedó corto. La diferencia sale en la **siguiente
  liquidación** de cada empleado: la **1ª quincena de julio/enero** para jornalizados y
  quincenales fijos, y la **2ª quincena de julio/enero** para mensualizados. *Ejemplo:* se pagaron
  $400.000 de aguinaldo; al confirmarse junio, el mejor mes quedó en $900.000. Corresponden
  $450.000, así que en la 1ª quincena de julio aparece "Diferencia SAC 1er sem. 2026" por $50.000.
- **Se aplica un retroactivo a un mes de un semestre cuyo aguinaldo ya se liquidó.** El retroactivo
  cuenta en el mes al que corresponde, así que puede cambiar el mejor mes. *Ejemplo:* una paritaria
  retroactiva a abril se aplica en la 1ª quincena de agosto; abril pasa de $1.000.000 a
  $1.100.000 y pasa a ser el mejor mes. Se habían pagado $500.000 de aguinaldo y ahora
  corresponden $550.000: en esa quincena de agosto aparece "Diferencia SAC 1er sem. 2026" por
  $50.000.

Detalles: lo que ya se pagó como diferencia de ese aguinaldo se descuenta, así nunca se paga dos
veces. Si la liquidación está en borrador y se vuelve a generar, la diferencia se recalcula (no se
duplica). Mientras el aguinaldo siga en borrador no hay diferencia: se regenera el propio
aguinaldo. En la pantalla del aguinaldo, la columna **Diferencias** muestra en qué quincena se
pagó cada una, o **Pendiente** cuando todavía no se cargó en ninguna liquidación.

## Liquidación final

Cuando un empleado se va, sus haberes, el aguinaldo y las vacaciones proporcionales — y la indemnización, si corresponde — se pagan en una **liquidación final**. Se genera desde la pestaña **Egreso** de su ficha (ver el tema **Egresos de empleados**), no desde acá.

En **Quincenas y Pagos** las liquidaciones finales de un mes aparecen juntas en una tarjeta: **Liquidaciones finales — noviembre 2026**. Al abrirla ves una fila por empleado que egresó ese mes, con lo **remunerativo**, lo **indemnizatorio**, los descuentos, el neto, el estado y un chip **Deuda pendiente** si los descuentos superaron lo que se le debe. Desde ahí se puede ver el detalle, hacer **Ajustes**, **Confirmar**, **Pagar** y **firmar el recibo**, y volver al egreso con **Ver egreso**.

Diferencias con una quincena:

- **No se genera ni se cierra "en bloque".** No hay botón de generar ni de cerrar la tarjeta: cada liquidación se confirma y se paga por separado, dentro de los 4 días hábiles del egreso.
- **Confirmar** cobra los préstamos del empleado. Si hay pedidos de adelanto o préstamos sin resolver, no deja confirmar.
- **Pagar** corta el acceso del empleado al portal.
- El neto **nunca queda por debajo de cero**: lo que no entra se anota como deuda pendiente en el egreso.
- No se puede asignar un adelanto, un retroactivo ni un aumento a una liquidación final.

## Descuentos automáticos

Al neto de la liquidación se le restan automáticamente:

- **Adelantos**: solo los que ya fueron **efectivamente pagados** (no alcanza con que estén
  aprobados, tienen que estar marcados como pagados). Un adelanto pendiente de pago no se
  descuenta todavía.
- **Cuotas de préstamo**, quincenales o mensuales, que vencen en ese período. Si una cuota
  quedó atrasada (su quincena pasó sin descontarse), se suma a la próxima liquidación que se
  genere. Las cuotas de un préstamo aprobado que todavía no se entregó no se descuentan. Ver el
  tema **Préstamos y cuotas**.

## Cerrar la quincena y la cotización del dólar

Si en la quincena se descontó alguna cuota de préstamo en **dólares**, al tocar **"Cerrar"**
aparece un diálogo con la cotización que se va a congelar:

- Es la del **día siguiente al cierre de la quincena** (ejemplo: la 1ª quincena de octubre, del 1
  al 15, usa la cotización del **16/10**) — siempre la misma fecha, no depende de cuándo se toca
  el botón.
- Se trae sola de la fuente configurada en **Configuración General** (oficial, blue, mayorista o
  bolsa; compra o venta), **precargada y editable**. Si esa fecha todavía no se publicó o la API
  no responde, el campo queda vacío con un aviso — hay que cargarla a mano para poder cerrar.
- El diálogo muestra a cuántos empleados afecta y, si la liquidación se generó con una cotización
  provisoria (porque se armó antes de que saliera la definitiva), el delta estimado respecto de
  esa provisoria.
- Al confirmar, la cotización queda **congelada**: se guarda en la quincena junto con su fecha y
  si vino de la API o se cargó a mano, y se **recalcula el neto** de los empleados con cuota en
  dólares si el valor final difiere del provisorio usado al generar. Desde ese momento el recibo
  no vuelve a cambiar.
- Una quincena sin préstamos en dólares se cierra exactamente igual que siempre, sin este paso.

Ver el tema **Préstamos y cuotas** para la regla completa de cómo se arma cada cuota en dólares.

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

Un adelanto anulado **deja de aparecer** en el detalle y en el recibo de la liquidación (y en el
total de Adelantos del Resumen de Gastos), no solo en el neto: si lo anulás y cargás uno nuevo
por el monto correcto, al volver a **Generar** la quincena el detalle muestra únicamente el
vigente.

## Retroactivos de gremio

Si se aplica un aumento de Convenio Colectivo con fecha retroactiva, el sistema agrega
automáticamente líneas de **"Retroactivo"** en la liquidación del período correspondiente, con
la diferencia calculada sobre lo ya liquidado en los períodos anteriores afectados.

<!-- ref: api_conmomet/controllers/loanController.js#markAsPaid, api_conmomet/controllers/salaryAdvanceController.js#markAsPaid, api_conmomet/controllers/salaryAdvanceController.js#delete, api_conmomet/controllers/salaryAdvanceController.js#findDuplicateAdvance, api_conmomet/controllers/salaryAdvanceDeletionAlertController.js, api_conmomet/controllers/payrollController.js#attachSignature, api_conmomet/controllers/payrollAdjustmentController.js, api_conmomet/controllers/payrollController.js#generateSac, api_conmomet/services/sacService.js, api_conmomet/helpers/sacCalculations.js, api_conmomet/services/finalPayrollService.js, conmomet-app/src/app/dashboard/pay-periods/[id]/payroll/FinalEntries.tsx, api_conmomet/controllers/categoryController.js#applyBonus, conmomet-app/src/app/dashboard/pay-periods/[id]/payroll/SacEntries.tsx, conmomet-app/src/app/dashboard/pay-periods/[id]/payroll/PayrollAdjustmentsModal.tsx, conmomet-app/src/components/SignaturePad.tsx, conmomet-app/src/components/common/SalaryAdvanceDeletionAlert.tsx, conmomet-app/src/app/dashboard/loans/page.tsx, conmomet-app/src/app/dashboard/salary-advances/page.tsx, conmomet-app/src/app/dashboard/pay-periods/[id]/payroll/page.tsx, api_conmomet/controllers/payPeriodController.js#close, api_conmomet/services/exchangeRateService.js, conmomet-app/src/app/dashboard/pay-periods/page.tsx -->
