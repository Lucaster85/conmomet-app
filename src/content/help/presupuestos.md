## ¿Qué es el módulo de Presupuestos?

Es donde se arman las cotizaciones para un cliente: mano de obra, materiales, y el ciclo de
aprobación. Se ubica en **Gestión de Clientes → Presupuestos**. Un Presupuesto aprobado puede
convertirse en un Proyecto real (ver más abajo).

Un presupuesto se puede crear suelto, como siempre, o nacer de un **Pedido de Cotización** (ver
el tema **Pedidos de Cotización**) — en ese caso llega con el cliente y la planta ya
precargados y **bloqueados** (no se pueden cambiar), y queda vinculado para siempre a ese
pedido. En el listado se ve un cartel con el número del pedido y su vencimiento de presentación;
**cuando el presupuesto se envía al cliente, el vencimiento desaparece** y el cartel pasa a decir
**"Enviado el dd/mm"** (ya no hay nada que vigilar). En el Ver/Imprimir sale el número del pedido
como un dato más, **sin el vencimiento** (esa fecha es interna, no tiene por qué salir en lo que
se le manda al cliente).

En el listado, si el presupuesto viene de un pedido que **tenés asignado**, aparece una etiqueta
de color: **"Asignado a vos"** mientras te toca armarlo, o **"A validar por vos"** si te lo
entregaron para que cargues los márgenes y lo revises. Así se encuentran de un vistazo los
presupuestos propios sin tener que ir al módulo de Pedidos de Cotización. La etiqueta desaparece
cuando el pedido ya se cotizó o se canceló, porque ya no hay nada pendiente de tu lado.

El recorrido completo, desde que entra el pedido del cliente hasta que se genera el Proyecto,
está graficado en el tema **Pedidos de Cotización**.

## Crear un presupuesto

Con el botón **"Nuevo Presupuesto"**:

- **Título*** y **Moneda** (ARS/USD).
- **Cliente*** (obligatorio) y **Planta** (se filtra según el cliente elegido). Si el
  presupuesto nació de un Pedido de Cotización, estos dos campos vienen completos y quedan
  bloqueados.
- **Relación con un proyecto** — está **debajo de Cliente y Planta** y solo ofrece los
  proyectos **del cliente elegido** (y de la planta, si elegiste una; sin planta se ven todos
  los del cliente). Hasta que no elegís un cliente, el campo está deshabilitado. Si después
  cambiás el cliente o la planta y el proyecto elegido ya no corresponde, se desvincula solo.
  Define qué pasa cuando se apruebe:
  - Vacío: es para un **proyecto totalmente nuevo**, que se crea al aprobar.
  - **"Vincular a un proyecto ya existente"**: a diferencia de los otros dos casos, el
    proyecto ya existe de antes — el vínculo queda firme **desde que se crea el presupuesto**,
    sin esperar a que se apruebe, y le actualiza las horas presupuestadas en cada guardado. Este
    presupuesto nunca tiene botón "Generar Proyecto" (no hay nada que generar). Un proyecto no
    se puede vincular a dos presupuestos a la vez. Mientras el presupuesto siga en Borrador, se
    puede cambiar o quitar este vínculo con normalidad.

  **Los adicionales ya no se crean desde acá.** La opción "Es un adicional de…" se quitó: un trabajo
  urgente se da de alta en **Gestión de Clientes → Adicionales**, que crea el proyecto y su presupuesto
  en el acto (ver el tema **Adicionales**). Los **borradores viejos** que ya estaban marcados como
  "adicional de…" siguen funcionando: el formulario muestra esa relación en solo lectura y conservan el
  botón "Generar Proyecto" de siempre.

### Presupuesto de un adicional

Un presupuesto que pertenece a un adicional (se crea junto con él) muestra arriba un ícono
**"i"** (con la explicación en un tooltip) y, al lado, el código **"Adicional A-2026-001 ↳ P-2026-063"**,
que es un acceso directo a la ficha del adicional. El **cliente, la planta y el proyecto** quedan
bloqueados —se gestionan desde el adicional— y el **título y la descripción se sincronizan** con el
adicional mientras el presupuesto esté en borrador. No se puede eliminar por separado (se elimina junto
con el adicional) ni genera un proyecto nuevo al aprobarse: el proyecto es el adicional. Los materiales
los puede cargar quien arma el adicional, sin margen; el margen se completa acá.
- **Descripción**, **Fecha de Inicio/Fin previstas**, **Vigencia (días)** (solo informativo, no
  bloquea nada), **N° de OT** (opcional).

Al **editar** un presupuesto que viene de un Pedido de Cotización, arriba del formulario aparece
el **pliego** adjunto al pedido, con un enlace para abrirlo o descargarlo — así quien arma el
presupuesto lo tiene a mano sin salir de acá. Lo ve quien tiene el pedido asignado o permiso
para ver Pedidos de Cotización. El título del formulario muestra además el N° de Cotización del
Cliente.

El **N° de Cotización del Cliente** no se carga acá: es un dato del Pedido de Cotización, se
carga una sola vez ahí y el presupuesto lo muestra a través de su PC (ver el tema **Pedidos de
Cotización**). Un presupuesto suelto, sin PC detrás, no tiene número de cotización del cliente.

## Líneas de Mano de Obra

Cada línea tiene **Rubro**, **Cantidad**, y — si tenés permiso para ver precios de
presupuestos — **Valor unitario** y **Moneda**. Al elegir un rubro, si la línea todavía no
tiene precio cargado, se **prellena automáticamente** con la Tarifa por Rubro vigente para ese
cliente (ver el tema **Clientes**) — es solo un punto de partida, se puede editar sin problema.

### Rubros repetidos

Un mismo rubro se puede cargar en **más de una línea**, cada una con su propio valor. Por ejemplo:
20 hs de Construcción para un ítem del pedido a un precio y otras 30 hs de Construcción para otro
ítem a otro precio. En el presupuesto se ven como dos líneas separadas (y cada una suma a su
propio total); en el **proyecto** las horas del rubro se agrupan en una sola bolsa (50 hs de
Construcción). La carga de horas de los empleados no cambia.

Con rubros repetidos la **Tarifa por Rubro del cliente no se actualiza**: se actualiza solo con
los rubros que aparecen en **una única línea** (con la repetición no habría una tarifa única para
guardar). Si el rubro tiene una sola línea, funciona como siempre. Un aviso en el formulario
recuerda esto. El texto "Ya cargado en el proyecto" se muestra solo en la primera línea de cada
rubro.

### Rubros por días

Un rubro puede estar configurado como **por días** (en **Configuración → Rubros de Presupuesto**,
tipo de unidad "Días"). En sus líneas se carga la cantidad de **días** y el valor es **por día**;
cada día equivale a **9 horas** en la bolsa de horas del proyecto: 2 días cargados se ven como
**18 hs** cotizadas. El formulario muestra la equivalencia ("= 18 hs") y en todas las vistas se ve
como "2 días (18 hs)". Los empleados cargan horas a ese rubro como siempre y se descuentan de esas
horas. Las 9 horas se guardan en cada línea: si más adelante cambia el tipo del rubro, los
presupuestos ya armados no se alteran. En un rubro por días la tarifa del cliente queda expresada
**por día**, sin conversión.

### Detalle de mano de obra

Al final del formulario (después del total y antes de las notas internas) hay un apartado
**"Detalle de mano de obra"** que lista cada línea numerada, con un campo para escribir su
**descripción**:

```
1 - Construcción - 20 hs: [descripción]
2 - Construcción - 30 hs: [descripción]
3 - Montaje - 20 hs: [descripción]
```

No es un texto aparte: se arma solo desde las líneas. Si agregás una línea aparece su fila; si
quitás una del medio, la numeración se reacomoda; cada línea conserva su propia descripción. Es
distinto de las **notas internas** del presupuesto. El detalle también aparece en la vista del
presupuesto, **debajo del total y sin precios** (las líneas sin descripción igual se listan). Todos
los que arman presupuestos pueden escribir las descripciones, tengan o no permiso de precios.

Si este presupuesto está vinculado a un proyecto que ya tiene horas reales cargadas — un
"vincular a un proyecto existente" (vinculado desde la creación, ver arriba) o un adicional que
ya generó su subproyecto estando en borrador (ver "Generar Proyecto" más abajo) — al lado de la
**Cantidad** de cada rubro aparece un texto informativo **"Ya cargado en el proyecto: X hs"**
apenas se elige ese rubro, y si ya hay horas cargadas para algún rubro se ve además un aviso
arriba de toda la sección. Es solo para tener visibilidad — nunca autocompleta ni pisa lo que
estés escribiendo.

## Líneas de Materiales

Cada línea tiene **Material** (se puede buscar o crear uno nuevo al vuelo sin salir del
formulario), **Proveedor**, **Cantidad**, **Unidad**, y — con permiso para ver costos — el
**costo real** del material y un **margen %**, con los que se calcula solo el precio al cliente.

En pantallas anchas (desde una laptop de 1024 px) las líneas se muestran como una **tabla alineada** bajo un encabezado
(Material, Proveedor, Cant., Unidad, Costo real, Margen %, Total): los textos largos se cortan con
"…" y el margen en pesos y el precio por unidad se ven en la columna Total (el precio por unidad
al pasar el mouse). En pantallas angostas (menos de unos 960 px: celular y tablet vertical) cada línea es una **tarjeta** (en tablet material y proveedor van lado a lado) con todos sus campos
apilados.

### Elegir y crear el material

El material es una lista con búsqueda: escribís para filtrar y, si no existe, aparece
**"Agregar «…»"** para crearlo ahí mismo (pide además su unidad y, con permiso de costos, el
proveedor y el costo). El material **siempre se elige del catálogo**: ya no se puede dejar
texto libre sin vincular.

### Proveedor de cada línea

El costo de un material **depende del proveedor** (ver el tema **Materiales**). Al elegir un
material de la lista, el proveedor queda en **"Sin especificar"** y el costo es el que tenga
cargado ese proveedor — elegir otro es opcional. El selector de proveedor muestra cada uno con
su precio (los que tienen precio primero, de menor a mayor) para poder compararlos, y también
permite crear uno nuevo escribiendo el nombre.

- **Cambiar de proveedor** cambia el costo de la línea al precio de ese proveedor.
- Si el proveedor elegido **no tiene precio** para ese material, el costo queda vacío: se carga
  a mano y queda guardado en el catálogo como el precio de ese proveedor.
- **Editar el costo** de una línea actualiza el precio de **ese proveedor** en el catálogo (y
  queda en el historial de costos). Guardar el presupuesto sin tocar el costo no genera nada.
- Sin permiso de costos se ve el nombre del proveedor, pero no su precio.

El proveedor es un dato interno: **no aparece** en la vista ni en la impresión para el cliente.

**Importante**: un material que todavía no tiene costo cargado para el proveedor elegido **no se
puede presupuestar** — hay que cargarlo en la línea o desde el catálogo de Materiales.

### Importar materiales desde Excel

Botones **"Descargar plantilla modelo"** e **"Importar Excel"**. El sistema busca una hoja llamada
"Materiales" dentro del archivo (si no la encuentra, usa la primera hoja) y reconoce las
columnas aunque tengan nombres parecidos (ej. "cant" o "qty" para cantidad). Las columnas son:
**Descripción, Cantidad, Unidad, Kg x mL, Proveedor, Costo Unitario y Moneda**. El costo puede
quedar vacío, y si no hay moneda se usa la del presupuesto.

Al importar, los materiales, unidades y proveedores que todavía no existan **se crean en el
catálogo**, y el costo del Excel pasa a ser el precio de ese proveedor (nunca el precio al
cliente). Después las filas se agregan al formulario con margen 0%, para seguir editando y
guardando de la forma normal.

### Descargar los materiales a Excel

El botón **"Descargar Excel"** baja los materiales cargados en el presupuesto, con **las mismas
columnas que la plantilla**: se puede editar y volver a importar. Funciona también antes de
guardar el presupuesto. Sin permiso de costos, las columnas de costo y moneda salen vacías.

## Ver, editar e imprimir

El ícono del ojo abre la **vista** del presupuesto, con los botones **Editar** (solo si está en
**Borrador**), **Cerrar** e **Imprimir** (este último, solo con permiso de precios). **Editar** abre
directo el formulario de ese presupuesto, sin volver al listado: es útil cuando se llega por un
acceso directo y lo que se quiere es modificarlo.

## El ciclo de estados

**Borrador** → **Enviado** → **Aprobado** o **Rechazado**.

- **"Enviar"**: pasa de Borrador a Enviado. **Requiere un permiso aparte** del de editar
  presupuestos: quien arma el presupuesto puede cargarlo y modificarlo todo lo que necesite,
  pero no necesariamente ponerlo en manos del cliente. Si no tenés ese permiso, el botón no
  aparece (ver el tema **Pedidos de Cotización**).
- **"Aprobar"**: opcionalmente se completa quién lo aprobó (un contacto/Supervisor del
  cliente) y se puede subir el documento firmado (o subirlo más adelante). El contacto se
  elige de una lista con búsqueda; si no está cargado, se escribe su nombre y se elige
  **"Agregar «nombre»"** para darlo de alta ahí mismo (pide nombre y apellido) sin salir del
  diálogo. Una vez aprobado, el
  mismo botón sirve para **reemplazar el documento firmado** sin cambiar de estado.
- **"Rechazar"**: pide un **motivo obligatorio**.

**Rechazado es un estado final**: a diferencia de las OCAs, un Presupuesto rechazado no tiene
un botón de "corregir" — la forma de arrancar de nuevo es **Duplicarlo** (ver abajo).

Si el presupuesto nació de un Pedido de Cotización, antes de llegar a "Enviado" pasa por un
ida y vuelta interno entre quien lo arma y gerencia. Cuando el presupuesto ya tiene cargados los
rubros y los materiales, el responsable usa el botón **"Entregar a gerencia"** — está acá mismo,
en la fila del presupuesto — y elige quién lo recibe: el pedido pasa a **A validar** y gerencia
carga los márgenes y lo envía (ver el tema **Pedidos de Cotización**). Apenas el presupuesto se
envía al cliente, el Pedido de Cotización se marca automáticamente como cumplido y se **avisa a
todos los que participaron del pedido** (responsables actuales y anteriores, quien cargó el pedido
y quien armó el presupuesto, menos quien lo envió) — con una notificación y un registro en la
línea de tiempo del pedido. Si el presupuesto no nació de un pedido, el aviso le llega solo a
quien lo armó.

## Bonificación

Botón **"Bonificación"** (solo con permiso para ver precios), disponible únicamente sobre
presupuestos **Enviados**. Dos porcentajes independientes — uno para mano de obra y otro para
materiales, entre 0 y 100 — que se aplican sobre los totales, sin tocar las líneas originales.

**Un presupuesto aprobado ya no admite bonificaciones**: el descuento se negocia mientras el
cliente decide, y una vez aprobado queda fijo. Es lo que permite facturar sobre un importe que
no cambia. Si hay que ajustar el descuento, hay que hacerlo antes de aprobar. Cada cambio de
bonificación queda registrado en la auditoría con el valor anterior y el nuevo.

## Los totales son "+ IVA"

Todos los importes de un presupuesto son **netos**: el total lleva la leyenda **"+ IVA"** al lado
(en el listado, el formulario, el Ver/Imprimir y la pestaña Presupuesto del proyecto). El IVA se
calcula recién al facturar (ver el tema **Facturación**).

Los presupuestos **aprobados** muestran en el listado un cartel con su **estado de facturación**
(*Sin facturar*, *Facturado parcial*, *Facturado* o *Facturado y cobrado*), visible para quien tiene
acceso a Facturación. Tocarlo lleva directo al detalle de facturación de ese presupuesto, donde se
ve cuánto queda por facturar y se registran las facturas.

## Generar Proyecto

Botón **"Generar Proyecto"**, disponible cuando el presupuesto está **Aprobado** y todavía no
generó ninguno. Crea el Proyecto real (nuevo o subproyecto, según lo elegido al crear el
presupuesto — ver arriba) y lo deja vinculado a este presupuesto. Solo se puede usar una vez
por presupuesto. **No aplica a "vincular a un proyecto existente"**: ese caso no tiene nada que
generar, ya quedó vinculado desde que se creó el presupuesto (ver arriba) — nunca muestra este
botón.

**Excepción para borradores viejos de "adicional de…"**: si el presupuesto quedó marcado así antes de
que existiera el módulo Adicionales, el botón aparece también estando todavía en **Borrador** — no hace falta esperar a aprobarlo. Sirve
para el caso típico de un adicional donde todavía no se sabe el alcance real (horas, materiales)
pero ya hay que empezar a trabajar: se genera el subproyecto de una, se van cargando horas ahí
(ver el tema **Proyectos**), y el presupuesto se sigue terminando de armar en paralelo — cada vez
que se guarda, las bolsas de horas por rubro del subproyecto se actualizan con lo que tenga el
presupuesto en ese momento. Una vez que el presupuesto ya generó su proyecto, no se puede
cambiar a qué proyecto está vinculado. Proyecto nuevo o vinculación a uno existente siguen
necesitando que el presupuesto esté aprobado.

## Duplicar

Botón **"Duplicar"**, disponible en cualquier estado. Crea un **Presupuesto nuevo en
Borrador** con el mismo cliente, planta, moneda, fechas y todas las líneas de mano de obra y
materiales — es la forma de volver a cotizar algo parecido, o de rearmar un presupuesto
rechazado desde cero. Las descripciones del Detalle de mano de obra y las líneas por días también
se copian.

Si el original venía de un **Pedido de Cotización**, al duplicar se pregunta una sola cosa: si
el duplicado **sigue vinculado al mismo PC** (hereda su N° de cotización del cliente, y cliente
y planta quedan bloqueados igual que en el original) o **nace libre, sin PC** (cliente y planta
se pueden editar, y no tiene N° de cotización del cliente hasta que se lo vincule a una PC).
Un presupuesto que no venía de un PC se duplica directo, sin preguntar nada.

**Presupuesto de un adicional:** el duplicado queda **vinculado al mismo adicional** (no huérfano), con
los materiales y la mano de obra como punto de partida; el diálogo lo aclara. Un adicional tiene **un
solo presupuesto en curso a la vez**: si ya hay uno que no fue rechazado, el botón Duplicar queda
deshabilitado ("El adicional ya tiene un presupuesto en curso"). Es la forma de rehacer un presupuesto
rechazado de un adicional (también se puede desde la ficha del adicional con "Nuevo presupuesto").

## Quién ve precios y costos, y quién puede enviar

El acceso al módulo lo da un permiso general, pero hay tres cosas que se gatean por separado:
**ver los costos**, **ver los precios de mano de obra** y **enviar el presupuesto al cliente**.

- Sin permiso de **costos**, no se ve el costo real de los materiales.
- Sin permiso de **precios**, no se ven los **valores de mano de obra** (valor unitario, moneda y
  total de cada rubro), ni el **total general** del presupuesto (porque incluye la mano de obra),
  ni la **Bonificación**, ni las Tarifas por Rubro del cliente. **Los precios y el margen de los
  materiales NO dependen de este permiso**: cualquiera con acceso a Presupuestos los ve y carga
  el margen. Quien no tiene este permiso ve, en lugar del total general, el **subtotal de
  Materiales** (la suma de las líneas que ve, sin bonificación).
  - **La mano de obra se puede cargar igual**: quien no tiene este permiso agrega, edita y quita líneas
    de mano de obra (rubro, cantidad y descripción), pero **no ve ni define los valores**. Al guardar,
    las líneas que ya existían **conservan su valor** (el total se recalcula con la cantidad nueva), y
    las líneas nuevas —o las que cambian de rubro— quedan **sin valor (0)** hasta que alguien con
    permiso de precios las complete. La Tarifa por Rubro del cliente no se actualiza con sus cargas.
  - **No puede enviar ni imprimir.** El botón "Enviar" no aparece (aunque tenga el permiso de
    enviar) y en "Ver" no hay botón "Imprimir": lo que saldría sería un presupuesto incompleto,
    sin la mano de obra.
- Sin permiso de **enviar**, no aparece el botón **"Enviar"**: se puede armar el presupuesto
  completo pero no presentarlo al cliente. Es el caso típico de quien cotiza a partir de un
  Pedido de Cotización y se lo entrega a gerencia para que lo revise y lo envíe.

Ojo con una combinación: el precio al cliente se calcula como costo + margen, así que quien ve el
precio y el margen de un material puede deducir su costo. Para cargar el margen hace falta ver el
costo real (permiso de **costos**), por eso el perfil que arma materiales necesita ese permiso.

Alguien sin permiso de precios igual puede armar el presupuesto — crear y editar, cargar la mano de
obra (rubro y cantidad) y los materiales con su margen, duplicarlo y generar el proyecto — pero no ve
ni define los valores de mano de obra, ni envía ni imprime.

<!-- ref: conmomet-app/src/app/dashboard/additionals/[id]/page.tsx, conmomet-app/src/app/dashboard/budgets/page.tsx, conmomet-app/src/utils/materialsExcel.ts, conmomet-app/src/components/common/CreatableSelect.tsx, api_conmomet/controllers/budgetController.js, api_conmomet/services/projectFactory.js, api_conmomet/controllers/quoteRequestController.js, api_conmomet/services/quoteRequestLogService.js, conmomet-app/src/components/budgets/TotalWithTax.tsx, conmomet-app/src/components/clients/ClientContactSelect.tsx, conmomet-app/src/components/quote-requests/QuoteRequestDueChip.tsx, conmomet-app/src/utils/billing.ts -->
