## ¿Qué es el módulo de Presupuestos?

Es donde se arman las cotizaciones para un cliente: mano de obra, materiales, y el ciclo de
aprobación. Se ubica en **Gestión de Clientes → Presupuestos**. Un Presupuesto aprobado puede
convertirse en un Proyecto real (ver más abajo).

Un presupuesto se puede crear suelto, como siempre, o nacer de un **Pedido de Cotización** (ver
el tema **Pedidos de Cotización**) — en ese caso llega con el cliente y la planta ya
precargados y **bloqueados** (no se pueden cambiar), y queda vinculado para siempre a ese
pedido. En el listado se ve un cartel con el número del pedido y su vencimiento de presentación;
en el Ver/Imprimir sale el número del pedido como un dato más, **sin el vencimiento** (esa fecha
es interna, no tiene por qué salir en lo que se le manda al cliente).

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
  - **"Es un adicional de"** un proyecto existente: al aprobar, genera un **subproyecto**
    hijo de ese proyecto.
  - **"Vincular a un proyecto ya existente"**: a diferencia de los otros dos casos, el
    proyecto ya existe de antes — el vínculo queda firme **desde que se crea el presupuesto**,
    sin esperar a que se apruebe, y le actualiza las horas presupuestadas en cada guardado. Este
    presupuesto nunca tiene botón "Generar Proyecto" (no hay nada que generar). Un proyecto no
    se puede vincular a dos presupuestos a la vez. Mientras el presupuesto siga en Borrador, se
    puede cambiar o quitar este vínculo con normalidad.
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

## El ciclo de estados

**Borrador** → **Enviado** → **Aprobado** o **Rechazado**.

- **"Enviar"**: pasa de Borrador a Enviado. **Requiere un permiso aparte** del de editar
  presupuestos: quien arma el presupuesto puede cargarlo y modificarlo todo lo que necesite,
  pero no necesariamente ponerlo en manos del cliente. Si no tenés ese permiso, el botón no
  aparece (ver el tema **Pedidos de Cotización**).
- **"Aprobar"**: opcionalmente se completa quién lo aprobó (un contacto/Supervisor del
  cliente) y se puede subir el documento firmado (o subirlo más adelante). Una vez aprobado, el
  mismo botón sirve para **reemplazar el documento firmado** sin cambiar de estado.
- **"Rechazar"**: pide un **motivo obligatorio**.

**Rechazado es un estado final**: a diferencia de las OCAs, un Presupuesto rechazado no tiene
un botón de "corregir" — la forma de arrancar de nuevo es **Duplicarlo** (ver abajo).

Si el presupuesto nació de un Pedido de Cotización, antes de llegar a "Enviado" pasa por un
ida y vuelta interno entre quien lo arma y gerencia. Cuando el presupuesto ya tiene cargados los
rubros y los materiales, el responsable usa el botón **"Entregar a gerencia"** — está acá mismo,
en la fila del presupuesto — y elige quién lo recibe: el pedido pasa a **A validar** y gerencia
carga los márgenes y lo envía (ver el tema **Pedidos de Cotización**). Apenas el presupuesto se
envía al cliente, el Pedido de Cotización se marca automáticamente como cumplido.

## Bonificación

Botón **"Bonificación"** (solo con permiso para ver precios), disponible únicamente sobre
presupuestos **Enviados** o **Aprobados**. Dos porcentajes independientes — uno para mano de
obra y otro para materiales, entre 0 y 100 — que se aplican sobre los totales, sin tocar las
líneas originales.

## Generar Proyecto

Botón **"Generar Proyecto"**, disponible cuando el presupuesto está **Aprobado** y todavía no
generó ninguno. Crea el Proyecto real (nuevo o subproyecto, según lo elegido al crear el
presupuesto — ver arriba) y lo deja vinculado a este presupuesto. Solo se puede usar una vez
por presupuesto. **No aplica a "vincular a un proyecto existente"**: ese caso no tiene nada que
generar, ya quedó vinculado desde que se creó el presupuesto (ver arriba) — nunca muestra este
botón.

**Excepción para adicionales**: si el presupuesto es "un adicional de" un proyecto existente, el
botón aparece también estando todavía en **Borrador** — no hace falta esperar a aprobarlo. Sirve
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
rechazado desde cero.

Si el original venía de un **Pedido de Cotización**, al duplicar se pregunta una sola cosa: si
el duplicado **sigue vinculado al mismo PC** (hereda su N° de cotización del cliente, y cliente
y planta quedan bloqueados igual que en el original) o **nace libre, sin PC** (cliente y planta
se pueden editar, y no tiene N° de cotización del cliente hasta que se lo vincule a una PC).
Un presupuesto que no venía de un PC se duplica directo, sin preguntar nada.

## Quién ve precios y costos, y quién puede enviar

El acceso al módulo lo da un permiso general, pero hay tres cosas que se gatean por separado:
**ver los costos**, **ver los precios** y **enviar el presupuesto al cliente**.

- Sin permiso de **costos**, no se ve el costo real de los materiales.
- Sin permiso de **precios**, no se ven los valores unitarios de mano de obra, ni los precios
  ni márgenes de materiales, ni los totales, ni la Bonificación, ni las Tarifas por Rubro del
  cliente.
- Sin permiso de **enviar**, no aparece el botón **"Enviar"**: se puede armar el presupuesto
  completo pero no presentarlo al cliente. Es el caso típico de quien cotiza a partir de un
  Pedido de Cotización y se lo entrega a gerencia para que lo revise y lo envíe.

Alguien sin permiso de costos ni de precios igual puede hacer todo el trabajo operativo — crear y
editar presupuestos (cargando rubros/cantidades y materiales/cantidades, sin precio),
duplicarlos y generar el proyecto — simplemente no ve los montos.

<!-- ref: conmomet-app/src/app/dashboard/budgets/page.tsx, conmomet-app/src/utils/materialsExcel.ts, conmomet-app/src/components/common/CreatableSelect.tsx, api_conmomet/controllers/budgetController.js, api_conmomet/services/projectFactory.js, api_conmomet/controllers/quoteRequestController.js -->
