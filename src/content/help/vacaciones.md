## Cuántos días de vacaciones le corresponden a un empleado

El **saldo de vacaciones** aparece en el legajo del empleado (sección **Saldo de Vacaciones**), al
cargar una licencia de tipo vacaciones y en el portal del empleado. Muestra los días
**correspondientes**, los **usados** (licencias de vacaciones aprobadas del año) y los
**disponibles**.

Los días correspondientes salen de la Ley de Contrato de Trabajo:

- **Por antigüedad** (art. 150), contada al 31 de diciembre del año: **14 días** hasta 5 años,
  **21** hasta 10, **28** hasta 20 y **35** de ahí en adelante.
- **Quien ya trabajaba antes del 1º de enero** tiene esos días completos.
- **Quien ingresó este año** tiene los días completos solo si va a trabajar **al menos la mitad de
  los días hábiles del año** (art. 151). Si no llega, le corresponde **1 día de vacaciones cada
  20 días trabajados**, redondeado hacia abajo (art. 153). La ley no pide "seis meses de
  antigüedad": mide los días trabajados dentro del año calendario, por eso el corte cae a principios de
  julio (el **2 de julio** en 2026, con semana de lunes a sábado). Quien ingresa antes llega a la mitad y tiene los 14 días; quien ingresa después
  tiene el proporcional.

Un ejemplo con semana de lunes a sábado: el año 2026 tiene 313 días hábiles, y la mitad son 157.
Alguien que ingresó el 1º de agosto trabaja 131 hasta el 31 de diciembre, así que le corresponden
131 ÷ 20 = **6 días**. Alguien que ingresó el 1º de junio trabaja 184 y tiene los **14 días**.

Cuando el saldo es proporcional, debajo del saldo se ve una leyenda que lo explica, con los días
trabajados y los que hacían falta.

## Qué cuenta como día trabajado

- Los **días hábiles** dependen de la **semana laboral de la empresa**, que se elige en
  **Configuración general → Vacaciones — Semana laboral**: *lunes a sábado* (lo que se usa hoy) o
  *lunes a viernes*. Los **domingos no cuentan**, aunque se trabajen como extra.
- Los **feriados** cuentan como trabajados, igual que las **licencias, vacaciones y enfermedad**
  (art. 152).
- Las **faltas injustificadas** cargadas en Asistencias **no cuentan** y restan días trabajados.
  Solo se tienen en cuenta para quien ingresó este año.
- Como la ley evalúa al cierre del año, los días trabajados se cuentan **hasta el 31 de diciembre**.
  Por eso el resultado de un empleado nuevo no cambia de un día para otro: queda fijo mientras no
  cambien sus faltas ni la semana laboral.

## Pisar la cantidad de días a discreción

En el legajo, el campo **Días de vacaciones (sobre-escribir)** manda sobre todo lo anterior. Si
tiene un número, **ese es el valor que figura como correspondiente**, sin importar la antigüedad ni
si el empleado es nuevo; con **0** el empleado queda sin vacaciones. Dejalo vacío para que se use la
regla de la ley. En el saldo se ve la leyenda "Días asignados manualmente".

## Lo que no cambia

- El saldo **no impide** cargar ni aprobar una licencia que lo supere: solo avisa.
- La liquidación de las quincenas paga los días de vacaciones aprobados, no depende de este saldo.
- Las **vacaciones no gozadas de un egreso** se calculan aparte (ver **Egresos de empleados**), con
  los días del año completo por antigüedad prorrateados por los días trabajados.

<!-- ref: api_conmomet/helpers/vacationDays.js, api_conmomet/services/vacationBalanceService.js, api_conmomet/controllers/leaveRequestController.js#getBalance, api_conmomet/controllers/selfServiceController.js#getMyVacationBalance, api_conmomet/controllers/systemSettingController.js, conmomet-app/src/utils/vacationBalance.ts, conmomet-app/src/app/dashboard/system-settings/page.tsx -->
