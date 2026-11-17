## ¿Qué es Facturación?

Es el módulo donde administración ve **qué presupuestos aprobados se pueden facturar**, cuánto de
materiales y de mano de obra **queda por facturar**, y donde **registra las facturas** (parciales o
totales) y sigue si se cobraron. Se ubica en **Facturación → Facturación**.

Una **Factura A** se puede **emitir directamente desde la app contra ARCA** (ver "Emitir una factura por
ARCA"). También se puede seguir **cargando a mano** una factura que ya se hizo en la web de ARCA, con
su número y, si se quiere, el PDF. Las dos formas conviven.

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
  del proyecto de ese presupuesto, **incluidas las horas manuales** (la tabla por rubro indica cuántas son
  manuales): las de sus adicionales **no** se suman, porque cada adicional tiene su propia fila.
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

## Emitir una factura por ARCA

Se entra al presupuesto y se usa **"Nueva factura"**. Si la conexión con ARCA está activa y hay puntos
de venta de tipo web service (ver el tema **Datos de mi empresa y conexión con ARCA**), el diálogo arranca
en **"Emitir por ARCA"**; con el selector de arriba se puede pasar a **"Cargar una ya emitida"**.

Emitir es un proceso **en dos pasos**:

1. **Guardar el borrador.** Se completan los mismos datos de siempre (conceptos y porcentajes, fecha,
   moneda, IVA) y, además:
   - **Punto de venta**: solo aparecen los de tipo web service, con su descripción de uso.
   - **Concepto**: *productos*, *servicios* o *ambos*. Se sugiere solo según lo que se factura (solo
     materiales = productos, solo mano de obra = servicios). Con servicios, ARCA exige el **período
     facturado** (desde y hasta) y el **vencimiento de pago**.
   - **Condición frente al IVA del receptor**: ARCA la exige desde el 1/12/2026. Se toma de la ficha del
     cliente (Responsable Inscripto o Monotributo; una Factura A no se le puede hacer a un cliente exento
     o consumidor final).
   - Opcionales: **condición de venta**, **remito** y **referencia comercial** (por ejemplo, el número de
     OC), que se imprimen en la factura.
   El borrador **no tiene número** todavía y **ocupa saldo** del presupuesto, como cualquier factura.
   Se puede editar o descartar.
2. **Emitir en ARCA.** Desde el listado, el ícono de **enviar**. Antes de emitir se muestra una
   confirmación con el **ambiente**, el punto de venta, el tipo, el cliente y el total. ARCA asigna el
   **número** y el **CAE**, y la factura queda **"Emitida en ARCA"**.

**Una factura emitida ya no se edita ni se anula** desde la app: ARCA ya la conoce. Si hay un error, se
corrige con una **nota de crédito** (próxima etapa). Hasta que exista, la nota de crédito se emite desde la
web de ARCA.

**Estados de la emisión:**

- **Borrador**: todavía no se mandó a ARCA. Se puede editar, emitir o descartar.
- **Emitida en ARCA**: tiene número y CAE. Desde acá es una factura normal: se puede marcar cobrada.
- **Rechazada por ARCA**: ARCA no la aceptó y explica el motivo en lenguaje claro (por ejemplo, una fecha
  fuera de rango). **No consumió ningún número.** Se corrige (vuelve a borrador) y se emite de nuevo, o
  se descarta.
- **Autorizando…**: se mandó a ARCA pero **no llegó la respuesta** (por ejemplo, se cortó la conexión).
  **No la emitas otra vez.** Usá **"Verificar en ARCA"** (ícono de sincronizar): la app consulta ARCA y, si
  el comprobante existe, completa la factura con su CAE; si no existe, vuelve a borrador. Mientras haya una
  "autorizando" en un punto de venta, no se pueden emitir otras en ese mismo punto de venta y tipo.

**Descartar** un borrador o una factura rechazada la deja anulada y **libera el saldo** del presupuesto,
sin necesidad de una nota de crédito (nunca existió para ARCA).

**Fechas.** ARCA no acepta una fecha de emisión muy lejana a hoy: hasta **5 días** antes o después con
productos, y hasta **10 días** con servicios. Tampoco puede ser anterior a la del último comprobante de
ese punto de venta. La app lo avisa antes de mandar nada. "Hoy" es siempre el de Argentina.

**Observaciones de ARCA.** A veces ARCA acepta la factura pero agrega una **observación** (por ejemplo,
que no encuentra el CUIT del receptor en su padrón). La factura sale con la etiqueta **"Con observaciones
de ARCA"**: pasá el mouse para leerla y revisala.

**Ambiente de pruebas.** Cuando el servidor está en **homologación**, las facturas salen con la etiqueta
**PRUEBA**: tienen CAE, pero **no tienen validez fiscal**.

**Si ARCA no funciona**, la facturación no se frena: se hace la factura en la web de ARCA, con un punto
de venta de "Comprobantes en línea", y se **carga a mano** con "Cargar una ya emitida".

**Dólares.** En una factura en dólares la **cotización** se precarga con la de ARCA (botón **"Traer de
ARCA"**) y se puede editar. Se indica si la factura **se cobra en dólares** (la misma moneda) o en pesos.
La factura guarda también el **total en pesos** (total × cotización).

**Quién puede emitir.** Además de poder cargar facturas hace falta un permiso propio, **emitir facturas por
ARCA**, porque es una acción irreversible. Cada emisión queda registrada con quién la hizo y en qué
ambiente.

## Registrar una factura ya emitida (carga manual)

Se entra al presupuesto (tocando su fila) y se usa **"Nueva factura"** (o **"Cargar una ya emitida"**).
Una factura tiene un
encabezado (tipo, punto de venta, número, fechas, moneda, IVA) y **una o más líneas**, una por
concepto. Nada obliga a separar los conceptos: se puede hacer cualquier combinación.

- **Tipo de comprobante**: arranca en **A**, pero se puede cambiar (A, B, C, E). Junto a la letra se
  elige la **clase**: factura, **factura de crédito electrónica (FCE)**, nota de débito o nota de
  crédito.
- **Punto de venta y número**: obligatorios. ARCA numera **por punto de venta y por clase**: una Factura A
  y una FCE A pueden tener el mismo número. Lo que no puede repetirse es el mismo número para la misma
  clase y punto de venta.
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

Por defecto, el listado de **Facturas** no muestra las anuladas (ver tema **Filtros de los
listados**) — cuando se muestran, siguen marcadas con menor opacidad, igual que antes.

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
- **Registrar facturas**: cargar facturas nuevas y facturas libres, y guardar borradores de ARCA.
- **Emitir facturas por ARCA**: permiso especial. Emite el borrador en ARCA y verifica las que quedaron
  "autorizando".
- **Marcar cobrada y anular**: permiso de modificar facturas.
- **Corregir**: permiso especial, para un único responsable.
- **Cobros sin factura**: permiso especial para cargarlos y verlos.

## Qué viene después

Por ahora la app emite **Factura A**. Las próximas etapas suman el **PDF con código QR**, la **Factura de
Crédito Electrónica (FCE)** y las **notas de crédito y débito** (que van a reemplazar a "anular" en los
comprobantes de ARCA). Para emitir hacen falta el **CUIT** y la **condición de IVA** del cliente (ver el
tema **Clientes**) y los datos de quien factura en **Configuración → Datos de mi empresa** (ver el tema
**Datos de mi empresa y conexión con ARCA**, donde también se **prueba la conexión**).

<!-- ref: conmomet-app/src/app/dashboard/billing/page.tsx, conmomet-app/src/app/dashboard/billing/[budgetId]/page.tsx, conmomet-app/src/components/billing/BillablesList.tsx, conmomet-app/src/components/billing/InvoiceDialog.tsx, conmomet-app/src/components/billing/InvoiceList.tsx, conmomet-app/src/components/billing/InvoiceActionDialogs.tsx, conmomet-app/src/app/dashboard/system-settings/page.tsx, api_conmomet/controllers/invoiceController.js, api_conmomet/services/arca/emission.js, api_conmomet/services/arca/feRequest.js, api_conmomet/services/billingService.js, api_conmomet/helpers/budgetTotals.js, conmomet-app/src/components/projects/ManualHoursPanel.tsx, api_conmomet/controllers/manualHoursController.js, api_conmomet/services/projectHoursService.js -->
