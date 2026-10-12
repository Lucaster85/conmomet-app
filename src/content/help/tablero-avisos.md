## Qué muestra la pantalla de inicio

Arriba de todo hay una fila de **contadores**, bajo el título "Tus pendientes". Ahí está, de un
vistazo, cuántas cosas tenés esperándote de cada tipo: pedidos de cotización, vencimientos de
documentación, OCAs a presupuestar, EPP por vencer, herramientas en reparación. Cada contador es
clickeable y te lleva al listado completo de ese módulo.

Debajo aparecen los **avisos con detalle**: una tarjeta por tema, con la lista de los items
concretos y los botones para actuar sobre ellos.

Solo ves los contadores y los avisos de los temas a los que tenés acceso. Si tu rol no maneja
documentación, por ejemplo, ese aviso no existe para vos.

## Marcar como visto

Antes, si tenías 10 pedidos de cotización asignados, la pantalla de inicio se volvía larguísima y
había que bajar scrolleando para encontrar la novedad. Ahora cada item tiene un **ícono de ojito**
a la derecha: al tocarlo, ese item se guarda como "ya lo vi" y sale del detalle.

Lo importante: **el contador de arriba no baja**. Si tenés 7 pedidos y marcás 6 como vistos, en el
detalle te queda solo el que no viste, pero el contador sigue diciendo **7**. Marcar como visto
ordena la pantalla; no resuelve ni cierra nada.

Si marcás todos, la tarjeta entera desaparece y queda únicamente el contador. La pantalla de
inicio te queda en una línea, y cuando llegue algo nuevo la tarjeta vuelve a aparecer sola con ese
item solo.

Hay dos atajos en cada tarjeta:

- **Marcar todos como vistos** — para limpiar de una.
- **Ver N más sin ver** — las tarjetas muestran hasta 5 items a la vez para no crecer sin
  control; con este botón ves el resto.

## Por qué un item puede volver a aparecer

Marcar como visto **no entierra las novedades**. Si algo importante cambia en un item que ya
habías marcado, vuelve solo al detalle. Por ejemplo:

- Te dejan un **comentario nuevo** en un pedido de cotización, o te lo **devuelven** para
  corregir.
- Un documento pasa de **"por vencer"** a **"vencido"**, o se renueva con otra fecha.
- Una OCA que ya habías visto vuelve a quedar **pendiente de presupuesto** después de un rechazo.

En cambio, un cambio menor (que alguien corrija el título de un pedido, por ejemplo) no lo hace
reaparecer: solo las novedades que te afectan.

## Volver a mostrar todo

En cualquier tarjeta donde hayas marcado cosas como vistas aparecen dos opciones al pie:

- **Mostrar los N vistos** — los despliega ahí mismo, en gris, sin desmarcarlos.
- **Volver a mostrar todo** — borra todas tus marcas de ese aviso y vuelve a mostrarte la lista
  completa como al principio.

## Lo que marcás es solo tuyo

Cada persona tiene sus propias marcas. Si marcás un aviso como visto, tus compañeros lo siguen
viendo en su pantalla de inicio hasta que ellos lo marquen. Nunca estás escondiéndole algo a otro.

## La campanita: qué pasó

Arriba a la derecha, al lado de tu avatar, hay una **campanita**. Es otra cosa distinta de los
avisos del inicio, y conviene tener clara la diferencia:

- Los **avisos del inicio** responden **"¿qué me falta hacer?"**. Se recalculan cada vez que
  entrás, y desaparecen cuando el pendiente se resuelve.
- La **campanita** responde **"¿qué pasó?"**. Es un historial: cada novedad queda ahí con su fecha,
  aunque ya la hayas resuelto.

El numerito rojo de la campanita cuenta las notificaciones **sin leer**. Al abrirla ves la lista,
las no leídas resaltadas con un punto rojo. Tocar una te lleva directo a lo que avisa y la marca
como leída; también podés usar **"Marcar todas"**.

Abrir la campanita **no** marca todo como leído: podés dejar algo sin leer a propósito, para
acordarte de volver.

La campanita registra:

- que te **asignaron** un pedido de cotización, que te **entregaron** un presupuesto para validar,
  que te **devolvieron** uno para corregir, y que se **envió** un presupuesto al cliente;
- que te quedó una **herramienta a cargo** para reparación;
- que hay una **OCA aprobada esperando presupuesto** (solo al usuario configurado para eso);
- que un **documento** o un **EPP** está por vencer o ya venció.

Las notificaciones se guardan por **90 días**; las más viejas se borran solas.

### Cuándo aparecen los avisos de vencimiento

Hay una diferencia que conviene entender para no esperar algo que no va a pasar. Los avisos de
pedidos, presupuestos, herramientas y OCAs se generan **en el momento exacto** en que alguien hace
la acción, porque hay una persona del otro lado apretando un botón.

Los de **vencimientos y EPP** son distintos: no los dispara nadie, los dispara el calendario. El
sistema los revisa **cuando alguien entra a la app** (como máximo una vez por hora), así que:

- la notificación te va a estar esperando en la campanita la próxima vez que entres;
- **no** te va a llegar al celular a una hora fija si nadie abrió el sistema ese día.

Si en algún momento hace falta que el aviso de vencimiento llegue al celular todos los días a una
hora puntual aunque nadie entre, eso se puede agregar — es una configuración del servidor, no un
cambio en la forma de usarlo.

## La campanita y el celular

Si activaste las notificaciones en tu celular o computadora (menú de tu usuario → **"Notificaciones
en este dispositivo"**), cada novedad de la campanita te llega además como notificación al momento,
aunque no tengas la app abierta.

La ventaja de que además quede en la campanita: **si el push no te llega, la novedad no se pierde**.
Antes, si tenías el celular apagado o nunca activaste las notificaciones, ese aviso no quedaba
registrado en ningún lado. Ahora siempre podés entrar a la campanita y verlo. Y como al celular le
llega un texto recortado, en la campanita los comentarios largos se leen completos.

## Las dos cosas son independientes

Marcar un aviso del inicio como visto **no** marca leída ninguna notificación de la campanita, ni al
revés. Son dos preguntas distintas, y está bien que una misma novedad aparezca en los dos lugares:
en la campanita como "esto pasó el martes", en el inicio como "esto todavía te falta hacer".

<!-- ref: conmomet-app/src/components/common/AlertViewsProvider.tsx, conmomet-app/src/components/common/DashboardAlertCard.tsx, conmomet-app/src/components/common/DashboardAlertSummaryBar.tsx, conmomet-app/src/app/dashboard/page.tsx, api_conmomet/controllers/userAlertViewController.js, api_conmomet/models/userAlertView.js -->
