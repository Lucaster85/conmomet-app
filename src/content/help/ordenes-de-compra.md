## Qué es y para qué sirve

Muchos clientes mandan una **orden de compra (OC)** cuando aprueban un presupuesto, y después piden que sus facturas la nombren. En **Facturación**, dentro del detalle de cada presupuesto aprobado, hay tres bloques para tener todo eso ordenado:

- **Órdenes de compra del cliente**
- **Seguros de caución**
- **Documentos para facturar**

La OC es **opcional**: hay clientes que no la emiten, y se puede facturar igual. Lo único que hace la app es avisarte cuando un presupuesto aprobado no tiene OC, para que no se te pase.

## Cargar una OC

1. Entrá a **Facturación** y abrí el presupuesto (tocá su fila).
2. En **Órdenes de compra del cliente**, tocá **Cargar OC**.
3. Completá el **número** y la **fecha** (lo único obligatorio). Si querés, también el **concepto** (materiales, mano de obra o ambos), la **moneda**, el **monto**, las **condiciones de pago**, y si la OC admite **ajuste de precios** (con su índice: IPC, UOCRA u otro).
4. Si la OC del cliente viene dividida en **posiciones**, cargalas con **Agregar posición** (número, descripción y monto, todo libre).
5. Podés **adjuntar archivos** (PDF, imágenes, Word o Excel; hasta 10 por vez, de 20 MB cada uno).

Un presupuesto puede tener **más de una OC vigente**. No puede haber dos vigentes con el mismo número en el mismo presupuesto.

**Ajuste de precios:** si la OC lo admite (con su índice), las facturas contra esa OC se pueden ajustar después (ver el tema **Facturación**, "Ajustes de precio"). Una OC que no lo admite bloquea el ajuste de sus líneas.

**Sin monto:** si dejás el monto vacío, la OC queda **solo de referencia**: sirve para tenerla a mano y nombrarla en las facturas, pero no se compara contra nada.

Solo se cargan OC en presupuestos **aprobados**.

## Corregir, reemplazar o rechazar una OC

- **Editar:** corrige los datos de una OC vigente (número, monto, posiciones, etc.).
- **Reemplazar:** cuando el cliente manda una OC nueva que pisa a la anterior. Cargás los datos de la nueva y el **motivo**. La anterior no se pierde: queda guardada como **Reemplazada**, con su motivo, y la nueva indica a cuál reemplaza.
- **Rechazar:** cuando el cliente la anula o no corresponde. Pide un **motivo** y la OC queda guardada como **Rechazada**. El presupuesto vuelve a figurar **sin OC**.
- **Eliminar** (el tachito): solo para una OC cargada **por error**. Borra la OC con sus posiciones y archivos y no se puede deshacer. Si la OC tiene seguros de caución asociados, primero hay que eliminarlos o reasignarlos.

Las OC rechazadas o reemplazadas se ven con el botón **Ver OC rechazadas o reemplazadas**.

**Si la OC ya tiene facturas:**

- **Reemplazar** pasa las facturas vigentes a la OC nueva. La OC nueva tiene que ser en la misma moneda, cubrir el concepto de lo ya facturado y, si tiene monto, alcanzar para lo facturado.
- **Rechazar** no se puede mientras haya facturas vigentes: reemplazala por la nueva o anulá primero las facturas.
- **Eliminar** no se puede nunca si tiene facturas.
- Al **editarla** no se puede bajar el monto por debajo de lo ya facturado ni cambiar su moneda o concepto.

La OC muestra cuánto se facturó contra ella y su saldo.

## "No lleva OC"

Si el cliente no emite OC para ese presupuesto, tocá **No lleva OC** en el cartel amarillo. El presupuesto deja de aparecer en el aviso del inicio. Es **reversible**: el cartel pasa a decir "Marcado como No lleva OC" y trae el botón **Sí lleva OC** para volver atrás.

**Importante:** los presupuestos que ya estaban aprobados antes de que existiera esta función aparecen todos en el aviso hasta que los cargues o los marques como "No lleva OC". Es esperable la primera vez.

## Seguros de caución

Algunos clientes piden una **póliza de caución**, por ejemplo para respaldar el **anticipo**. En **Seguros de caución** tocá **Cargar caución** y completá:

- **Aseguradora**, **número de póliza**, **monto** y **moneda** (obligatorios).
- **Motivo** (anticipo u otro), **fecha de emisión** y **vencimiento**.
- **Avisar con anticipación (días):** con cuánta anticipación querés el aviso. Por defecto, 30 días.
- Una **OC asociada**, si corresponde (tiene que ser de este mismo presupuesto).
- La **póliza** en PDF o imagen (un archivo por caución; si subís otro, reemplaza al anterior).

**Sin vencimiento** (hay clientes que piden pólizas sin fecha) la caución se guarda igual, pero **nunca avisa**.

### Avisos de vencimiento

Cuando falta el plazo de aviso para que venza una caución, y de nuevo cuando vence, le llega una notificación en la **campanita** a todas las personas que tienen acceso a **Facturación**. Además aparece en el inicio el aviso **Seguros de caución por vencer** (en rojo si ya venció), que lleva directo al presupuesto.

Los avisos se generan cuando alguien entra a la app (como máximo una vez por hora), igual que los de vencimiento de documentación (ver el tema **Avisos del inicio y campanita**).

### Marcar como liberada

Cuando el cliente devuelve la póliza o ya no hace falta, tocá **Marcar liberada**: la caución **deja de avisar**. Si te equivocás, **Reactivar** la vuelve a poner en juego. Para una caución cargada por error, usá el tachito.

## Documentos para facturar

En **Documentos para facturar** guardás cualquier archivo que el cliente pida adjuntar o que necesites tener junto a la facturación del presupuesto: contratos, planillas, certificados. Elegí los archivos, poné una **descripción** si querés y tocá **Subir**.

## El aviso "Presupuestos aprobados sin OC"

En el **inicio** aparece la tarjeta **Presupuestos aprobados sin OC**, con la lista de presupuestos aprobados que no tienen una OC vigente y no están marcados como "No lleva OC". Cada uno tiene dos botones:

- **Cargar OC:** te lleva al detalle de facturación del presupuesto.
- **No lleva OC:** lo marca directamente desde el inicio.

El aviso desaparece solo cuando se carga una OC vigente o se marca que no lleva. Podés marcarlo como visto como cualquier otro aviso (ver **Avisos del inicio y campanita**).

## Quién puede hacer qué

Todo esto cuelga de los permisos de **Facturación**, no hay permisos aparte:

- **Ver Facturación:** ver las OC, cauciones y documentos, y los avisos.
- **Registrar facturas:** cargar y reemplazar OC, cargar cauciones, adjuntar archivos.
- **Modificar facturas:** editar o rechazar una OC, editar y liberar cauciones, marcar "No lleva OC".
- **Eliminar:** eliminar OC, cauciones, archivos y documentos.

<!-- ref: conmomet-app/src/components/billing/BillingDocsSection.tsx, conmomet-app/src/components/billing/PurchaseOrderDialog.tsx, conmomet-app/src/components/billing/SuretyBondDialog.tsx, conmomet-app/src/components/common/PurchaseOrderMissingAlert.tsx, conmomet-app/src/components/common/SuretyBondAlert.tsx, conmomet-app/src/app/dashboard/billing/[budgetId]/page.tsx, api_conmomet/controllers/purchaseOrderController.js, api_conmomet/controllers/suretyBondController.js, api_conmomet/controllers/billingFileController.js, api_conmomet/services/billingDocsService.js, api_conmomet/services/suretyBondService.js, api_conmomet/services/expirationNotifier.js, api_conmomet/middlewares/billingUpload.js -->
