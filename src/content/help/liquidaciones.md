## ¿Qué es una Quincena?

Es el período de liquidación: **1º quincena** (día 1 al 15) y **2º quincena** (día 16 a fin de
mes). Cada quincena pasa por tres estados: **Abierta** (se puede generar/regenerar la
liquidación), **Cerrada** y **Pagada**. Se ubica en **Contabilidad → Quincenas y Pagos**.

## Jornalizados vs. Mensualizados

Los dos tipos de empleado se liquidan distinto:

- **Jornalizados** (por hora): se liquidan en **cada quincena por separado**, con las horas
  trabajadas de esos 15 días.
- **Mensualizados** (sueldo fijo): se liquidan **una sola vez al mes**, siempre en la **2º
  quincena**, cubriendo el mes completo (sueldo, extras, vacaciones, licencias y faltas de
  todo el mes). Por eso en la 1º quincena no aparecen en el listado de liquidación — salvo que
  tengan activado el adelanto automático quincenal (ver más abajo), que es un adelanto, no una
  liquidación.

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
  jornalizados (un mensualizado ya está cubierto por su sueldo fijo).

Cada uno de estos ítems se calcula distinto según el empleado sea jornalizado o mensualizado,
pero conceptualmente es lo mismo: horas/días trabajados o no trabajados que impactan el monto
final.

## Descuentos automáticos

Al neto de la liquidación se le restan automáticamente:

- **Adelantos**: solo los que ya fueron **efectivamente pagados** (no alcanza con que estén
  aprobados, tienen que estar marcados como pagados). Un adelanto pendiente de pago no se
  descuenta todavía.
- **Cuotas de préstamo** que vencen en ese período.

## Adelanto automático quincenal (mensualizados)

Un empleado mensualizado puede tener activado un flag ("Adelanto quincenal automático") en su
ficha. Si lo tiene, cada vez que se genera la **1º quincena** el sistema le crea (o actualiza,
mientras siga sin pagar) un **Adelanto** — no una liquidación — por la mitad de su sueldo más
el valor de las horas extra cargadas hasta el día 15. Ese adelanto queda aprobado y pendiente
de pago, para pagarlo y subir el comprobante como cualquier otro adelanto.

**Importante**: mientras ese adelanto no esté marcado como pagado, el sistema **no deja
confirmar** la liquidación de la 2º quincena de ese empleado — es para evitar pagarle el mes
completo sin haber descontado todavía el adelanto que ya recibió.

## Confirmar y Pagar

Cada liquidación individual pasa por: **Borrador → Confirmada → Pagada**.

- **Confirmada**: deja de recalcularse automáticamente al tocar "Generar" — a partir de acá
  cualquier ajuste se hace a mano.
- **Pagada**: la liquidación queda cerrada, ya no se puede editar.

## Retroactivos de gremio

Si se aplica un aumento de Convenio Colectivo con fecha retroactiva, el sistema agrega
automáticamente líneas de **"Retroactivo"** en la liquidación del período correspondiente, con
la diferencia calculada sobre lo ya liquidado en los períodos anteriores afectados.
