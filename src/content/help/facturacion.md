## ¿Qué es Facturación?

Es el módulo donde administración ve **qué presupuestos aprobados se pueden facturar**, cuánto de
materiales y de mano de obra **queda por facturar**, y donde **registra las facturas** (parciales o
totales) y sigue si se cobraron. Se ubica en **Facturación → Facturación**.

Por ahora el sistema **no emite** las facturas: la factura se hace en ARCA como siempre y después se
**carga acá** con sus datos y, si se quiere, el PDF. Más adelante (ver el último punto) la emisión
se va a poder hacer directamente desde la app.

## Cuándo aparece un presupuesto

Lo que se factura es el **presupuesto aprobado**, no el proyecto. Aparece en la lista **apenas se
aprueba**, aunque todavía no se haya generado el proyecto: así se pueden facturar los materiales
antes de empezar la obra.

- Si el presupuesto todavía no tiene proyecto, en lugar del avance de horas dice **"Sin proyecto
  todavía"**.
- Los **adicionales** tienen su propio presupuesto, así que aparecen como **filas propias**, con sus
  horas propias.

## Cómo leer cada fila

Cada presupuesto muestra:

- **Identificación**: el número de presupuesto, el Pedido de Cotización (con el número del
  cliente), el proyecto, el cliente con su CUIT y la fecha de aprobación.
- **Materiales** y **Mano de obra**: el importe **neto con la bonificación ya aplicada**, una barra
  con el porcentaje ya facturado, y el **saldo** que queda.
- **Avance de horas** (en mano de obra): por ejemplo "70 de 270 hs (26%)". Son las horas **propias**
  del proyecto de ese presupuesto: las de sus adicionales **no** se suman, porque cada adicional
  tiene su propia fila.
- **Saldo total**: lo que queda por facturar, con la leyenda **"+ IVA"** y el importe del IVA debajo.
- **Estado**: *Sin facturar*, *Facturado parcial*, *Facturado* (no queda saldo, pero hay facturas
  sin cobrar) o *Facturado y cobrado*. Si hay facturas sin cobrar, además se indica cuántas.

Si se facturó **más mano de obra que el avance real** del proyecto, aparece la alerta **"Facturado >
avance"**. Es solo un aviso: no bloquea nada. Se calcula comparando el porcentaje facturado de mano
de obra con el porcentaje de horas ya trabajadas.

## Orden y filtros

La lista viene ordenada para que lo más urgente quede arriba:

1. Primero los presupuestos que **todavía tienen algo para facturar**.
2. Entre esos, los que tienen **materiales sin facturar** (se pueden facturar antes de empezar).
3. Después, los de **mayor avance de horas**.
4. Por último, los **aprobados hace más tiempo**.

Se puede filtrar por **cliente**, por **estado de facturación**, por **"con facturas pendientes de
cobro"**, y buscar por presupuesto, pedido, proyecto, cliente o CUIT.

## Registrar una factura

Se entra al presupuesto (tocando su fila) y se usa **"Nueva factura"**. Una factura tiene un
encabezado (tipo, punto de venta, número, fechas, moneda, IVA) y **una o más líneas**, una por
concepto. Nada obliga a separar los conceptos: se puede hacer cualquier combinación.

- **Tipo de comprobante**: arranca en **A**, pero se puede cambiar (A, B, C, E).
- **Punto de venta y número**: obligatorios. No puede repetirse el mismo número para el mismo tipo y
  punto de venta.
- Con **"+ Agregar materiales"** o **"+ Agregar mano de obra"** se suma cada concepto. Para cada uno
  se muestra el **saldo disponible** y se carga **el porcentaje o el monto, lo que prefieras**: el
  otro valor se calcula solo. En mano de obra, además, se ve el **equivalente en horas** (por
  ejemplo, 30% de 270 hs = 81 hs).
- No se puede facturar **más que el saldo** del concepto.
- Se puede **adjuntar el PDF** del comprobante y dejar notas.

Los tres casos más comunes:

- **Anticipo de materiales**: una factura solo con materiales (por ejemplo al 100%), antes de empezar.
- **Factura por avance de mano de obra**: más adelante, una factura de mano de obra por el porcentaje
  que corresponda al avance (por ejemplo, 30%).
- **Una sola factura por todo** (proyectos chicos): el botón **"Facturar todo el saldo"** completa
  todos los conceptos con lo que queda, al 100%.

## Moneda

Cada factura es en **una sola moneda**. Si el presupuesto mezcla pesos y dólares, se hacen facturas
**separadas**, una por moneda. En el diálogo solo aparecen las monedas que todavía tienen saldo. Para
dólares hay un campo de **cotización**, opcional y solo informativo.

## IVA

Los importes del presupuesto son **netos**. Al facturar se suma el IVA con la **alícuota** que se
elija en la factura (por defecto, 21%). Las alícuotas disponibles se administran en **Configuración
General → Facturación — Alícuotas de IVA**: arranca solo con 21% y se pueden agregar otras (10,5%,
27%, 0%…) si hace falta. Cambiar esa lista **no modifica** las facturas ya cargadas: cada una guarda la
alícuota que usó.

Un cobro **"Sin factura"** no lleva IVA (ver más abajo).

## Marcar como cobrada, corregir y anular

Una factura recién cargada queda **Pendiente de cobro**.

- **Marcar cobrada**: pide la fecha de cobro y la pasa a **Cobrada**. Opcionalmente se puede
  **adjuntar el comprobante de pago** (una transferencia, un recibo…), que queda guardado junto a la
  factura y se abre desde el listado o desde "Ver". Por ahora no hay cobros parciales: una factura
  está cobrada o no.
- **Corregir** (ícono de lápiz): si **cargaste mal un dato** (por ejemplo el número de factura),
  se corrige y listo, sin anular nada. Se puede corregir una factura pendiente o cobrada. Es una acción
  reservada a **un responsable** (requiere un permiso especial) y **cada corrección queda
  registrada** con el valor anterior y el nuevo.
- **Anular**: se usa cuando **la factura real se anuló** (por ejemplo en ARCA). Pide un **motivo
  obligatorio** y **libera el saldo** del presupuesto para poder volver a facturarlo. Una factura
  anulada no se puede editar.

Las facturas **no se borran nunca**: así queda siempre el registro. Si cargaste mal un dato, corregí;
si la factura dejó de existir, anulá.

## Cobros sin factura

A veces se cobra algo sin comprobante fiscal. Se registra igual, con el tipo **"Sin factura"**: no lleva
punto de venta, número ni IVA. Solo lo pueden **cargar y ver** quienes tienen un permiso especial.

Aunque no lo vean, **siempre descuenta del saldo** del presupuesto: así nadie factura dos veces lo
mismo. Quien no tiene el permiso ve el concepto como "cubierto por un registro reservado", sin número
ni archivo, y nunca suma en los totales de IVA.

## Factura libre

Para proyectos que **no tienen presupuesto** en el sistema (por ejemplo, anteriores a este módulo), en
la pestaña **Facturas** está el botón **"Factura libre"**. Se elige el **cliente** (obligatorio) y,
si se quiere, el **proyecto**, y se cargan líneas con una **descripción** y un **monto** libres, sin
porcentaje de avance. Aparece en el registro de facturas como cualquier otra.

## El registro de facturas

La pestaña **Facturas** lista todos los comprobantes cargados, con tipo y número, fecha, cliente,
presupuesto o proyecto, neto, IVA, total, estado y PDF. Se puede filtrar por cliente, estado, tipo y
fechas, y desde ahí se pueden ver, corregir, marcar como cobradas o anular.

En el listado de **Presupuestos**, los presupuestos aprobados muestran además un cartel con su
**estado de facturación**; tocarlo lleva directo al detalle de facturación de ese presupuesto.

## Quién puede hacer qué

- **Ver Facturación**: ver los montos del presupuesto **dentro de este módulo**, aunque no se tenga
  permiso para ver los precios en Presupuestos.
- **Registrar facturas**: cargar facturas nuevas y facturas libres.
- **Marcar cobrada y anular**: permiso de modificar facturas.
- **Corregir**: permiso especial, para un único responsable.
- **Cobros sin factura**: permiso especial para cargarlos y verlos.

## Qué viene después

La idea es integrar el módulo con **ARCA** para **emitir las facturas directamente desde la app**,
sin cargarlas a mano. Para eso ya se guardan el **CUIT** y la **condición de IVA** de cada cliente
(ver el tema **Clientes**). Cuando exista la emisión, las notas de crédito van a reemplazar a "anular"
en los comprobantes oficiales.

<!-- ref: conmomet-app/src/app/dashboard/billing/page.tsx, conmomet-app/src/app/dashboard/billing/[budgetId]/page.tsx, conmomet-app/src/components/billing/BillablesList.tsx, conmomet-app/src/components/billing/InvoiceDialog.tsx, conmomet-app/src/components/billing/InvoiceList.tsx, conmomet-app/src/components/billing/InvoiceActionDialogs.tsx, conmomet-app/src/app/dashboard/system-settings/page.tsx, api_conmomet/controllers/invoiceController.js, api_conmomet/services/billingService.js, api_conmomet/helpers/budgetTotals.js -->
