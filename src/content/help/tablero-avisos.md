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

## ¿Y las notificaciones al celular?

Son otra cosa, y conviven con esto. Los avisos de esta pantalla responden **"¿qué me falta
hacer?"** y se recalculan cada vez que entrás. Las notificaciones push al celular avisan **"esto
acaba de pasar"** en el momento en que pasa (hoy funcionan para pedidos de cotización y
presupuestos; se activan desde el menú de tu usuario → "Notificaciones").

Marcar un aviso como visto acá no tiene ningún efecto sobre las notificaciones del celular, ni al
revés.

<!-- ref: conmomet-app/src/components/common/AlertViewsProvider.tsx, conmomet-app/src/components/common/DashboardAlertCard.tsx, conmomet-app/src/components/common/DashboardAlertSummaryBar.tsx, conmomet-app/src/app/dashboard/page.tsx, api_conmomet/controllers/userAlertViewController.js, api_conmomet/models/userAlertView.js -->
