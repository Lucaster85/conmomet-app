## ¿Qué es Facturación?

Es el módulo donde administración ve **qué presupuestos aprobados se pueden facturar**, cuánto de
materiales y de mano de obra **queda por facturar**, y donde **registra las facturas** (parciales o
totales) y sigue si se cobraron. Se ubica en **Facturación → Facturación**.

Una **Factura A** o una **Factura de Crédito Electrónica (FCE)** se pueden **emitir directamente desde la app contra
ARCA** (ver "Emitir una factura por ARCA" y "Factura de Crédito Electrónica (FCE)"). También se puede seguir **cargando a mano** una factura que ya se hizo en la web de ARCA, con
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
2. **Emitir en ARCA.** Desde el listado, el ícono de **enviar**. Antes de emitir se abre la **vista previa de
   la factura**: se ve **tal cual saldrá la factura final** (emisor, cliente, líneas, totales y leyendas), con
   asteriscos en lo que todavía no existe: el **número**, el **CAE**, su vencimiento y el **QR** los asigna ARCA al
   emitir. Arriba se indica el **ambiente** (pruebas o producción). Si todo está bien, **"Emitir en ARCA"**; si no,
   **Cancelar** y se corrige el borrador. Al emitir, la factura queda **"Emitida en ARCA"**.

   **El ícono del ojito ("Ver")** muestra lo mismo sin tener que emitir: la pestaña **Vista previa** (o **Factura**, si ya está
   emitida) muestra la factura en su formato final, como un PDF; en un borrador, con asteriscos en el número, el CAE y el QR. En una
   factura emitida es el **PDF real**, con **Abrir en una pestaña** y **Descargar**. La pestaña **Datos** tiene el resumen de siempre
   (cliente, presupuestos, líneas, totales y estado).

**Una factura emitida ya no se edita ni se anula** desde la app: ARCA ya la conoce. Si hay un error, o si hay
que devolver parte de lo facturado, se corrige con una **nota de crédito** (ver "Anular una factura de
ARCA: notas de crédito y de débito").

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

**El PDF de la factura.** Al emitirse, la app genera sola el **PDF de la factura** con el formato de ARCA: datos del
emisor y del cliente, el detalle, los totales, el **CAE** con su vencimiento y el **código QR**, en **tres copias**
(original, duplicado y triplicado). Aparece como **PDF** en el listado de facturas y en "Ver". El PDF se arma con los
datos **que quedaron guardados al emitir**: si después se cambia el domicilio de la empresa o el nombre del cliente, la
factura ya emitida **no cambia**. En el ambiente de pruebas, el PDF lleva la marca **"HOMOLOGACIÓN – SIN VALIDEZ
FISCAL"**. Si por algún motivo no se pudo generar (la factura igual quedó emitida), aparece el ícono **"Generar PDF"**
en las acciones.

**El código QR** es el que exige ARCA: al escanearlo se abre el verificador de ARCA con los datos del comprobante, para
comprobar que el CAE corresponde a esa factura.

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

## Factura de Crédito Electrónica (FCE)

La **FCE MiPyMEs** es un tipo de factura que ARCA obliga a usar con ciertos clientes (en general, grandes empresas): con
ellos, una Factura A común puede ser **rechazada**. **Lo elige a mano quien factura**, en el selector **"Tipo de
comprobante"** del diálogo (Factura A o FCE): la app no decide por el cliente. Se emite igual que una Factura A (borrador y
después "Emitir en ARCA"), con tres datos más:

- **Cuenta bancaria del emisor (CBU)**: se elige entre las cargadas en **Datos de mi empresa** (viene la predeterminada que
  sirva para la moneda de la factura). El **CBU y el alias** se informan a ARCA y salen impresos. Quedan **guardados en la
  factura al emitir**: si después se cambia la cuenta, la factura ya emitida no cambia. La app comprueba que el CBU sea válido
  (los dos dígitos verificadores) antes de mandarlo, porque ARCA no lo controla.
- **Opción de transferencia**: **SCA** (sistema de circulación abierta) o **ADC** (agente de depósito colectivo). Viene
  precargada con la **del cliente** (se configura en la ficha del cliente; hay clientes que piden una en particular, por ejemplo
  ADC) o, si no tiene, la **de la empresa**.
- **Vencimiento de pago**: **siempre obligatorio** en una FCE, aunque se facturen solo materiales.

Además, en **Referencia comercial** conviene poner el **número de orden de compra**: algunos clientes lo exigen (por ejemplo,
Bunge). En una FCE admite **hasta 50 caracteres**.

El **PDF** de una FCE lleva, además de lo habitual, el **CBU y alias del emisor**, la **opción de transferencia con su leyenda** y el
**aviso legal de aceptación** (21 días corridos), como el de ARCA. La numeración de la FCE es **independiente** de la de las
Facturas A: cada punto de venta tiene su propia secuencia por tipo de comprobante.

**Aceptación del cliente.** El cliente acepta o rechaza la FCE en ARCA (si no responde en 21 días corridos se considera
aceptada). Por ahora **se registra a mano**: en el listado, el ícono de **"Aceptación del cliente"** (solo en una FCE ya emitida)
abre un diálogo para marcarla **pendiente**, **aceptada** o **rechazada**. Es solo un registro: no cambia nada más de la factura.
Consultarlo automáticamente en ARCA queda para más adelante.

**Rechazos más comunes de ARCA**, explicados en pantalla:
- *El cliente no figura en el padrón o está inactivo*: se revisa el CUIT en **Clientes**. Una FCE solo se puede emitir a un
  cliente registrado.
- *El CUIT del cliente es el mismo que el de la empresa*: no se le puede facturar a uno mismo.
- *Faltan datos de la FCE* (CBU, opción de transferencia o vencimiento): la app los pide antes de mandar nada.

**En el ambiente de pruebas (homologación)**, ARCA solo reconoce como cliente de una FCE a algunos **CUIT de prueba**; los CUIT reales de
los clientes pueden ser rechazados ("no se encuentra registrado en los padrones"). Para probar, usá un cliente con el CUIT de prueba
**33693450239**. En producción se usa el CUIT real.

Una FCE emitida, como cualquier factura de ARCA, **no se edita ni se anula** desde la app: se corrige con una nota de crédito (ver
la sección siguiente). Las notas de una FCE tienen **reglas propias de ARCA**, que la app ya cumple: no llevan CBU, alias ni opción de
transferencia, ni vencimiento de pago, y llevan una marca de **anulación**.

## Anular una factura de ARCA: notas de crédito y de débito

ARCA **no permite anular** una factura emitida: se **corrige con una nota**. En la lista de facturas, las facturas emitidas tienen dos
acciones nuevas: **"Nota de crédito (anular o acreditar)"** y **"Nota de débito"**. Los dos tipos nacen como **borrador**, igual que las
facturas, y se emiten con el mismo botón de **enviar**: al guardar el borrador la app abre directamente la vista previa de la nota, lista para emitir.

**Nota de crédito.** Acredita (resta) lo que elijas de la factura:
- Para cada línea de la factura (materiales, mano de obra…) se carga el **porcentaje** o el **monto** a acreditar: es un porcentaje **de esa
  línea de la factura**, no del presupuesto. Se ve cuánto de la línea **queda por acreditar**, y no se puede acreditar más que eso.
- **"Anulación total (todo lo que queda)"** completa todas las líneas con lo que falta acreditar.
- El **motivo es obligatorio**. Además se puede escribir una descripción por línea; si queda vacía, la nota dice qué se acredita y sobre qué factura.
- La nota **hereda de la factura** el cliente, la moneda, la cotización, el IVA, el concepto y el período. Solo se elige la fecha y el punto
  de venta (viene el de la factura).
- **Qué pasa con el saldo del presupuesto:** un **borrador no libera saldo** (si lo liberara, se podría facturar de nuevo sobre ese saldo y después
  descartar la nota). Recién cuando la nota **se emite en ARCA**, lo acreditado vuelve a estar disponible para facturar.
- Los borradores **sí cuentan** para el límite: dos borradores no pueden acreditar entre los dos más que la factura. Un borrador descartado devuelve
  lo que reservaba.
- **Si las notas emitidas acreditan todas las líneas de la factura, la factura queda anulada** y libera su saldo: es la forma de "anular" una
  factura de ARCA. Si ya se había cobrado, **lo cobrado hay que devolverlo por fuera de la app**.
- Una factura **acreditada en parte** sigue viva y muestra cuánto se acreditó; lo que **falta cobrar** baja en lo que se acreditó.
- Una nota de crédito **no se cobra** (no tiene "Marcar cobrada") y, una vez emitida, **no se edita ni se anula**.

**Nota de débito.** Suma un **cargo adicional** a la factura (intereses, una diferencia de cambio…): se cargan **conceptos libres**, cada uno con descripción y
monto. Lleva el mismo IVA que la factura. **No cambia el saldo del presupuesto** (no es avance facturado) y sí se **cobra** como una factura.

**Facturas de ARCA solamente.** Las notas se hacen sobre facturas **emitidas desde la app**. Las notas de crédito y de débito **ya no se cargan a mano**: una nota
necesita estar atada a su factura para ajustar el saldo. Las facturas cargadas a mano se siguen anulando con **"Anular"**, como siempre.

**Notas de una FCE.** Si la factura es una FCE, la nota es de FCE (de crédito o de débito) y ARCA aplica sus reglas:
- Una nota normal se emite siempre sin marca de anulación.
- La **marca de anulación** ("Es una anulación: el cliente rechazó la FCE") solo la admite ARCA si el **cliente rechazó la FCE**. Por eso la casilla se habilita recién
  cuando registrás ese rechazo con el ícono **"Aceptación del cliente"** de la factura.
- El monto de una nota de crédito de una FCE **no puede superar el saldo actual de su cuenta corriente** en ARCA (la factura, más las notas de débito, menos las
  de crédito ya emitidas).

**Cómo se ve.** Las notas aparecen en la lista junto a la factura, con **"sobre Factura A 0003-00000001"** debajo de su número y los importes de las notas de crédito en
**negativo**. La factura original muestra **"Acreditada en parte: $…"**. Cada nota emitida tiene su **PDF**, que indica el **comprobante asociado**.

## Registrar una factura ya emitida (carga manual)

Se entra al presupuesto (tocando su fila) y se usa **"Nueva factura"** (o **"Cargar una ya emitida"**).
Una factura tiene un
encabezado (tipo, punto de venta, número, fechas, moneda, IVA) y **una o más líneas**, una por
concepto. Nada obliga a separar los conceptos: se puede hacer cualquier combinación.

- **Tipo de comprobante**: arranca en **A**, pero se puede cambiar (A, B, C, E). Junto a la letra se
  elige la **clase**: factura o **factura de crédito electrónica (FCE)**. Las notas de crédito y de
  débito no se cargan a mano: se hacen desde la factura emitida.
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

## Facturar varios presupuestos y OC en una sola factura

Una factura puede cobrar **más de un presupuesto del mismo cliente**, y cada línea puede ir contra una **OC** del cliente.

- **Desde el listado:** tocá **Nueva factura**, elegí el cliente y tildá los presupuestos que cobra la factura. Se abre el armado de la factura con un bloque por presupuesto.
- **Desde un presupuesto:** en el armado de la factura, abajo de los conceptos, **Agregar otro presupuesto del mismo cliente** suma otro bloque.
- Cada bloque tiene sus conceptos (materiales, mano de obra), su **Facturar todo el saldo** y la **✕** para sacarlo de la factura.
- Cada línea **descuenta del saldo de su presupuesto**: ese es el límite. Si además elegís una **OC** en la línea, también se respeta el **saldo de la OC** (cuando tiene monto). La OC tiene que ser de ese presupuesto, estar vigente, ser de la misma moneda y admitir ese concepto.
- Una línea puede repetir el concepto si va contra OC distintas; la misma OC y concepto no se repiten.
- **Todos los presupuestos tienen que ser del mismo cliente** y estar aprobados, y la factura es de una sola moneda.
- La **referencia comercial** se completa sola con los números de las OC de las líneas (se puede cambiar). En la FCE admite hasta 50 caracteres.
- La **descripción** de cada línea es opcional: si la dejás vacía sale "Se factura el X% de … — OC … · PRES-… título"; podés escribir la tuya (por ejemplo, con la posición de la OC).

La factura aparece en el detalle de **cada** presupuesto, con la parte que le toca a ese presupuesto, y descuenta de cada saldo. En el listado figuran todos sus presupuestos. Si se anula o se acredita con una nota de crédito, el saldo vuelve a cada presupuesto y a cada OC.

Un presupuesto con una sola factura sigue funcionando igual que siempre.

## Avance real de obra (aparte del avance por horas)

En el detalle de cada presupuesto, **Avance real de obra** registra cuánto avanzó la obra según el cliente, **al lado del avance por horas y sin modificarlo**. Sirve para comparar lo que se facturó contra lo que el cliente reconoce como avance.

- **Cargar avance:** fecha, porcentaje **acumulado** (por ejemplo, 40% de la obra hasta esa fecha) y el origen: **cargado a mano** o **certificado del cliente** (con su número y estado: presentado, aprobado o rechazado), con el certificado adjunto si lo tenés.
- **El avance vigente** es la última medición que **cuenta**: las cargadas a mano y los certificados **aprobados**. Un certificado presentado todavía no cuenta y uno rechazado nunca.
- **Es acumulado:** no puede ser menor que el de una medición anterior (ni mayor que el de una posterior).
- **"Facturado > avance real"** es un aviso informativo: aparece cuando lo facturado de mano de obra supera el avance real vigente (también en el listado de Por facturar). No bloquea nada.
- Al armar una factura, cada línea puede **asociarse al avance** que se factura (por ejemplo, el del certificado). Es solo informativo: no cambia el saldo. Un avance asociado a una factura no se puede eliminar.

## Ajustes de precio (IPC, UOCRA…)

Cuando el precio de lo facturado se ajusta por un índice, el ajuste **se factura aparte, como una factura nueva**, vinculada a la original. No es una nota de débito: sale por ARCA como cualquier factura.

1. En el listado, en una factura **ya emitida por ARCA**, tocá **Crear ajuste** (el ícono de la flecha hacia arriba).
2. Tildá las **líneas que se ajustan**. Solo se ajustan materiales y mano de obra; si la línea es de una OC, la OC tiene que **admitir ajuste de precios** (se marca al cargar la OC). Sin OC, se puede.
3. Para cada línea elegí el **índice** (IPC INDEC, UOCRA u otro) y cargá el **porcentaje** o el **monto**. La base es lo que queda de la línea después de las notas de crédito. Por ejemplo, 20% de $1.000.000 es una factura de $200.000.
4. Indicá la fecha, el punto de venta, el vencimiento y, si querés, el **período** (sale en la descripción: "Ajuste IPC INDEC (Octubre 2026) s/ Factura A 0003-00000123 – OC … – PRES-…"). La descripción de cada línea se puede reemplazar por otra.
5. Se guarda como **borrador** y se emite desde el listado, igual que cualquier factura.

**Calcular con el IPC del INDEC:** el diálogo tiene una calculadora. Elegí el **mes base** (por defecto, el de la factura) y, si querés, el mes hasta el que se ajusta (vacío = el último publicado), tocá **Calcular** y después **Aplicar a las líneas**. El porcentaje es la variación acumulada del índice entre los dos meses (cociente de índices, no la suma de los meses). El INDEC publica con **un mes de demora**; si no se puede consultar, cargá el porcentaje a mano.

Cosas para saber:
- El ajuste **no cambia el saldo** del presupuesto ni de la OC. En el detalle del presupuesto aparece aparte, en "Ajustes de precio facturados", y la factura se identifica con "Ajuste s/ Factura …" (y la original, con "Ajustada: $…").
- Cada factura admite **un solo ajuste vigente**. Si el borrador se descarta o el ajuste se anula, se puede crear otro.
- **Una factura de ajuste no se ajusta de nuevo.**
- Para **anular** un ajuste ya emitido se hace una nota de crédito sobre él.
- **No se puede anular del todo una factura que tiene un ajuste vigente:** primero se anula el ajuste.
- Los ajustes solo se crean sobre facturas emitidas por ARCA.

## Facturar OCAs

Una **OCA aprobada** (horas hombre o de grúa) se puede facturar sin pasar por un presupuesto. Desde **Nueva factura** elegí el cliente y tildá las OCA que cobra la factura (también se pueden sumar desde el armado, con **Agregar una OCA del cliente**, y mezclarlas con presupuestos del mismo cliente).

- **Se factura entera:** una línea por OCA, sin porcentajes. El **importe sale de las horas y del valor hora de la OCA** con la misma cuenta del presupuesto de la pantalla de OCAs: horas hombre = (simples + 1,5 × al 50% + 2 × al 100%) × valor hora; grúa = horas de cada vehículo × su valor hora. No se escribe a mano.
- **Cuándo se puede:** la OCA tiene que estar **aprobada**; si necesita presupuesto, el **presupuesto aprobado** también; y con el **valor hora cargado**. Si falta algo, el listado lo dice.
- **En pesos:** las OCA se facturan en pesos.
- **Descripción:** por defecto "Hora hombre OCA 0001" o "Servicio de grúa OCA 0001". Se puede reemplazar por la que pida el cliente (por ejemplo, "Hora hombre, construcción 4773 OC 117242-104").
- **Se factura una sola vez:** mientras la factura esté vigente, la OCA queda marcada **Facturada** (en Facturación y en el listado de OCAs) y no se puede volver a facturar. **Anular la factura libera la OCA.** Si se acredita con una nota de crédito, al quedar la factura anulada la OCA vuelve a estar disponible.
- **Una OCA facturada no se modifica:** no se pueden anular, rechazar, cambiar sus horas ni su valor hora. Si hay que tocarla, primero se anula la factura.
- Una factura de OCA **no toca ningún saldo de presupuesto**. Todas las OCA y presupuestos de una factura tienen que ser del mismo cliente.

## Diferencia de cambio en facturas en dólares

Si una factura está en **dólares** y se cobra con otra cotización, se emite una **nota por diferencia de cambio**: de **débito** si el dólar **subió**, de **crédito** si **bajó**. Va **en pesos** y asociada a la factura en dólares (Bunge las pide).

1. En el listado, en una factura **en dólares ya emitida por ARCA**, tocá **Diferencia de cambio** (el ícono de las flechas de moneda).
2. Indicá la **cotización nueva** (la del día de cobro; **Traer de ARCA** la completa) y, si hace falta, el **neto en dólares** sobre el que se calcula (por defecto, lo que queda de la factura después de las notas de crédito; bajalo si se cobró solo una parte).
3. La pantalla muestra qué nota se genera: neto = dólares × (cotización nueva − cotización de la factura), más el IVA de la factura. Se guarda como **borrador** y se emite desde el listado.

Cosas para saber:
- El tipo (débito o crédito) lo decide el signo de la diferencia; si no hay diferencia, no se puede hacer.
- **Una sola nota por diferencia de cambio vigente por factura.** Si se descarta o se anula, se puede hacer otra.
- **No cambia el saldo** del presupuesto, y la nota de crédito en pesos no baja lo que falta cobrar de la factura en dólares (están en monedas distintas). La nota de débito emitida se cobra como cualquier otra, en pesos.
- Bunge pide hacerlas dentro de los 15 días: es un plazo a tener en cuenta, la app no lo bloquea.

## OC del cliente, cauciones y documentos

Dentro del detalle de cada presupuesto aprobado también se cargan las **órdenes de compra del cliente**, los **seguros de caución** (con aviso de vencimiento) y los **documentos para facturar**. Cuando un presupuesto aprobado no tiene OC, aparece un aviso en el inicio. Está explicado en el tema **Órdenes de compra y cauciones**.

## Qué viene después

Por ahora la app emite **Factura A**, **Factura de Crédito Electrónica (FCE)** y sus **notas de crédito y de débito**. Para emitir hacen falta el **CUIT** y la **condición de IVA** del cliente (ver el
tema **Clientes**) y los datos de quien factura en **Configuración → Datos de mi empresa** (ver el tema
**Datos de mi empresa y conexión con ARCA**, donde también se **prueba la conexión**).

<!-- ref: conmomet-app/src/app/dashboard/billing/page.tsx, conmomet-app/src/app/dashboard/billing/[budgetId]/page.tsx, conmomet-app/src/components/billing/BillablesList.tsx, conmomet-app/src/components/billing/InvoiceDialog.tsx, conmomet-app/src/components/billing/InvoiceList.tsx, conmomet-app/src/components/billing/InvoiceActionDialogs.tsx, conmomet-app/src/app/dashboard/system-settings/page.tsx, api_conmomet/controllers/invoiceController.js, api_conmomet/services/arca/emission.js, api_conmomet/services/arca/feRequest.js, api_conmomet/services/arca/invoicePdf.js, api_conmomet/services/arca/codes.js, api_conmomet/services/arca/pdfService.js, api_conmomet/services/arca/qr.js, api_conmomet/services/billingService.js, api_conmomet/services/billingMath.js, api_conmomet/services/creditNoteService.js, conmomet-app/src/components/billing/InvoiceNoteDialog.tsx, conmomet-app/src/components/billing/BillingDocsSection.tsx, conmomet-app/src/components/billing/NewInvoiceStartDialog.tsx, conmomet-app/src/components/billing/InvoiceAdjustmentDialog.tsx, conmomet-app/src/components/billing/ProgressEntriesSection.tsx, api_conmomet/services/ocaBillingService.js, api_conmomet/middlewares/ocaBilled.js, conmomet-app/src/components/billing/ExchangeDifferenceDialog.tsx, api_conmomet/services/ipcService.js, api_conmomet/controllers/budgetProgressController.js, api_conmomet/services/budgetProgressService.js, api_conmomet/services/adjustmentService.js, api_conmomet/services/billingService.js, api_conmomet/helpers/budgetTotals.js, conmomet-app/src/components/projects/ManualHoursPanel.tsx, api_conmomet/controllers/manualHoursController.js, api_conmomet/services/projectHoursService.js -->
