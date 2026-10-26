## Qué es un préstamo

Un préstamo es plata que la empresa le adelanta a un empleado y que se le va descontando **en cuotas fijas** de cada liquidación. Se pide desde el portal del empleado (necesita al menos 1 año de antigüedad) o lo carga directamente administración desde **Contabilidad → Préstamos**. Un empleado solo puede tener un préstamo activo a la vez.

## Pedido y aprobación

1. El empleado pide un **monto** y, si quiere, una **cantidad de cuotas** deseada. Las cuotas son **quincenales**: se descuentan de cada liquidación.
2. Administración revisa el pedido y lo **aprueba** definiendo los términos finales: monto, cantidad de cuotas, **interés mensual**, **frecuencia de cuotas** y fecha de entrega. También puede **rechazarlo**.
3. Al aprobar se puede indicar que **ya se le entregó** el dinero (con comprobante y/o firma opcionales), o dejarlo "Aprobado — pend. de pago" y marcarlo como pagado cuando se entregue.

**El plan de cuotas se arma cuando el préstamo se entrega.** Un préstamo aprobado pero sin entregar no descuenta nada. Al marcarlo como pagado, el plan se arma con la **fecha de ese día** como fecha de entrega.

## Cuotas quincenales o mensuales

Al aprobar o cargar un préstamo se elige la **Frecuencia de cuotas**: **Quincenal** (viene seleccionada por defecto) o **Mensual**.

- **Quincenal:** la 1ª cuota vence la **quincena siguiente** a la de la entrega y después se alternan 1ª y 2ª quincena. Ejemplo: entregado el 10/11 → la 1ª cuota es la 2ª quincena de noviembre, la 2ª es la 1ª quincena de diciembre, y así. Entregado el 20/11 → la 1ª cuota es la 1ª quincena de diciembre.
- **Mensual:** una cuota por mes, empezando el **mes siguiente** a la entrega, en la quincena del día en que se entregó.

### Interés

El interés siempre se carga como **"Interés mensual %"**. En cuotas **mensuales** cada cuota cobra ese porcentaje sobre el saldo; en cuotas **quincenales** cada cuota cobra **la mitad**. El formulario muestra la cuota estimada y el interés por cuota antes de confirmar. Las cuotas se calculan con amortización francesa (cuota fija, el interés va sobre el saldo que queda).

### Mensualizados

Los empleados **mensualizados** se liquidan una sola vez al mes, en la 2ª quincena. Para ellos la frecuencia queda **fija en Mensual** (el selector aparece deshabilitado) y la cuota vence siempre en la **2ª quincena**, sin importar el día de entrega. Los jornalizados y los quincenales fijos usan quincenal por defecto.

## Descuento automático en la liquidación

Al generar la liquidación de una quincena se descuentan solas las cuotas que vencen en ella. Algunas cosas a tener en cuenta:

- Si una cuota **quedó atrasada** (su quincena pasó sin descontarse), se **suma a la próxima liquidación** que se genere. Si hubo varias atrasadas, entran todas juntas.
- A un mensualizado, en su liquidación de 2ª quincena, se le suman todas las cuotas del mes.
- Un préstamo **aprobado pero no entregado** no se descuenta.
- Regenerar una liquidación no duplica el descuento.
- Al descontar la última cuota el préstamo pasa a **Completado**.

## Liquidación por baja

Si el empleado renuncia o lo despiden, el botón **Liquidar** cancela lo que queda del préstamo: la cuota que está corriendo en la quincena actual (o vencida) se cobra **completa**, y todas las siguientes se cobran **solo el capital**, sin interés. En cuotas mensuales la cuota del mes en curso cuenta como corriendo.

## Préstamos viejos "a discreción"

Los préstamos anteriores a este formato (marcados "a discreción", en pesos o dólares) no tienen cuotas: se cobran con pagos manuales y el interés se suma con el botón **Aplicar interés**. Siguen funcionando igual. Ese botón no está disponible para préstamos de cuota fija, porque su interés ya está dentro de cada cuota.

## Ver el plan de cuotas

En el detalle de un préstamo de cuota fija se ve la frecuencia y la tabla con cada cuota: cuándo vence, capital, interés, total y estado (programada, descontada o liquidada por baja).

<!-- ref: conmomet-app/src/app/dashboard/loans/page.tsx, conmomet-app/src/utils/loanAmortization.ts, conmomet-app/src/components/PaymentReceiptDialog.tsx, conmomet-app/src/app/portal/requests/page.tsx, api_conmomet/controllers/loanController.js, api_conmomet/services/loanAmortizationService.js, api_conmomet/services/loanInstallmentDue.js, api_conmomet/controllers/payrollController.js -->
