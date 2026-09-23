## ¿Qué es la Carga de Horas?

Es donde se registran las horas trabajadas de cada empleado, día a día. Se ubica en
**Personal → Carga de Horas**. Estas horas son la base de dos cosas importantes: la
**liquidación de sueldos** y la generación de **Remitos / OCAs** para facturarle al cliente.

## Carga Masiva vs Carga Individual

Al abrir **"Nuevo Registro"** hay dos modos:

- **Carga Masiva / Único Bloque**: un mismo horario (mismo ingreso, egreso, proyecto, etc.)
  para **varios empleados a la vez** — por ejemplo, toda una cuadrilla que trabajó de 08:00 a
  17:00 en el mismo proyecto. Se activa solo con elegir más de un trabajador.
- **Carga Individual / Multi-bloque**: para **un solo empleado** que tuvo **más de un bloque de
  horas en el mismo día** — por ejemplo, turno partido, o cambio de proyecto a mitad del día.
  Se pueden agregar tantos bloques como haga falta, cada uno con sus propios datos, y abajo se
  ve el total de horas acumuladas.

## Los datos de un registro

- **Trabajadores**: a quién corresponden las horas. Los empleados **mensualizados** y
  **quincenales** aparecen marcados aparte (ver más abajo).
- **Fecha**: el día trabajado. Determina en qué quincena de pago cae y si es feriado.
- **Ingreso / Egreso**: las horas **regulares se calculan solas** (egreso menos ingreso), no
  hace falta cargarlas a mano.
- **Recargo 50% / Recargo 100%**: a diferencia de las horas regulares, estos **sí se cargan a
  mano** — son la parte de lo trabajado que corresponde pagar con recargo. Para empleados por
  hora, no pueden sumar más que las horas regulares del bloque.
- **Concepto** (opcional): si el empleado tiene una tarifa especial configurada para ese
  concepto, ese bloque se paga con esa tarifa en vez de la general. Si el concepto es de
  **horas de grúa**, se habilita (y se vuelve obligatorio) elegir la **Grúa / Vehículo**
  correspondiente.
- **Planta / Proyecto**: opcional. Al elegir un proyecto se habilita elegir el **Supervisor**
  del cliente que corresponde a esas horas.
- **PEP OCA / PEP Regular / OCA sin PEP**: con el supervisor elegido, se puede marcar una de las
  tres. **PEP OCA** son horas en planta que sí se facturan al cliente — quedan disponibles más
  adelante para incluirse en un Remito/OCA. **PEP Regular** son horas en planta que no se
  facturan a ningún cliente, pero igual quedan registradas como tales (suman permanencia en
  planta del empleado). **OCA sin PEP** es la combinación inversa a PEP Regular: la hora **sí**
  queda disponible para un Remito/OCA, pero **no** suma permanencia en planta — para cargas que
  se facturan al cliente pero no deben contar como PEP del empleado.
- **Llegada tarde**: un tilde general que marca que la persona llegó tarde ese día. Es solo
  informativo, queda visible como etiqueta en el listado.
- **Observaciones**: texto libre para cualquier aclaración.

## Feriados trabajados

Si la fecha elegida es un **feriado** y el empleado es por hora, los campos de recargo
desaparecen y se reemplazan por un aviso ("Día feriado — recargo 100%"), quedando en 0
automáticamente. Esto es a propósito: un feriado trabajado ya se paga al doble por su cuenta,
así que sumarle además un recargo manual terminaría pagándolo triple.

## El ciclo de vida de un registro

Un registro puede estar en uno de estos tres estados: **Pendiente**, **Aprobado** o
**Anulado**. No existe un estado "Rechazado".

La forma en que arranca es automática y depende de quién carga las horas:

- Si un encargado o administrador carga horas **de otra persona**, el registro nace
  **Aprobado** directamente.
- Si alguien carga **sus propias horas**, el registro nace **Pendiente** y necesita que
  alguien con permiso lo apruebe (botón de tilde verde en el listado).

Desde Pendiente o Aprobado, un registro se puede pasar a **Anulado** en cualquier momento
(salvo las excepciones de abajo).

## Si hay un error: anular y corregir

No hay una forma de editar un registro ya cargado. Para corregir un dato mal cargado, hay que
**Anular** el registro (con un motivo opcional) — el sistema abre automáticamente un formulario
nuevo precargado con los mismos datos, para corregirlos y guardarlo de nuevo. Mismo criterio
que "Corregir y Duplicar" en las OCAs.

Dos cosas a tener en cuenta al anular:

- **No se puede anular** (ni cargar) un registro que caiga en una **quincena ya cerrada o
  pagada**.
- Si el registro ya estaba incluido en un **Remito/OCA**, anularlo lo **desvincula** de esa
  OCA — la OCA en sí queda como estaba, solo se libera esa línea de horas.

## Empleados mensualizados y quincenales

Los empleados con sueldo fijo (mensualizados o quincenales) se distinguen con la etiqueta
**"(Mensualizado)"** o **"(Quincenal)"** en el selector de trabajadores. Como su sueldo no
depende de las horas trabajadas, en el listado no se les muestra el detalle de
ingreso/egreso/horas regulares — solo lo demás (recargos, proyecto, PEP, etc.). El comportamiento
es el mismo para ambas figuras; la única diferencia entre ellas está en la liquidación (ver
**Liquidación de Sueldos**).

## Filtros del listado

- **Empleado**: ver todos o filtrar por uno en particular.
- **Período**: esta quincena (por defecto), quincena anterior, este mes, mes anterior, ver
  todos, o un rango de fechas personalizado.
- **Ver anuladas**: los registros anulados quedan ocultos por defecto — este switch los vuelve
  a mostrar.
