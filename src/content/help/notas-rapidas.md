## Para qué sirven

Las **notas rápidas** son tu bloc de notas dentro de la app: un lugar para anotar una idea o un
pendiente en el momento, sin tener que salir de la pantalla en la que estás trabajando.

Son **solo tuyas**: nadie más las ve, ni siquiera un administrador, y no dependen de ningún permiso
de tu rol. Todos los que entran al sistema pueden usarlas.

## Cómo abrirlas

Hay un **botón redondo con un lápiz** abajo a la derecha, en todas las pantallas del sistema. Tocalo
y se abre el panel de notas desde el costado (en el celular ocupa toda la pantalla). Para cerrarlo,
tocá la **X** o cualquier lugar fuera del panel; vas a seguir exactamente donde estabas.

- Si tenés notas **vencidas o para hoy**, el botón muestra un numerito rojo con cuántas son. Solo
  cuenta esas, no todas las pendientes.
- En el celular el botón se **esconde al bajar** por una pantalla y vuelve al subir, para no taparte
  los botones de lo que estás mirando.
- En la computadora también podés abrirlas con el teclado: **Alt + N**. Te deja el cursor listo para
  escribir. No funciona si justo estás escribiendo en otro campo.

## Cargar una nota

Escribí en el campo de arriba y apretá **Enter**. Si necesitás un salto de línea, usá **Shift + Enter**.
En el celular podés tocar el botón del **avioncito** al lado del campo.

Si cerrás el panel antes de guardar, lo que escribiste **no se pierde**: queda esperando cuando lo
vuelvas a abrir.

### Ponerle un vencimiento (opcional)

Debajo del campo hay tres opciones, antes de guardar:

- **Hoy** o **Mañana**.
- **Elegir fecha**, para cualquier otro día.

Volvé a tocar la opción elegida para sacarla. El vencimiento es **solo una fecha**, sin hora. Las notas
que no tienen vencimiento quedan debajo de las que sí, ordenadas de la más nueva a la más vieja.

## En la pantalla de inicio

En **Inicio** hay una tarjeta **Mis notas**, la primera de la fila, con tus notas pendientes a la vista
sin tener que abrir el panel. Arriba a la derecha muestra cuántas pendientes tenés en total.

- Muestra hasta **5**, con las **vencidas y las de hoy primero**, cada una con su etiqueta de fecha.
- Tildá el casillero de una nota para **completarla** ahí mismo. Aparece el aviso **Deshacer** abajo.
- Tocá el texto de una nota para abrir el panel y editarla.
- **Nueva nota** abre el panel listo para escribir, y **Ver todas** lo abre con la lista completa (las
  completadas están ahí, plegadas).

Si no tenés ninguna pendiente, la tarjeta lo dice y te deja el botón **Nueva nota**. La tarjeta
aparece siempre, también en el celular, y no depende de ningún permiso.

## Cómo se ve cada nota

Las pendientes se ordenan así: **primero las que tienen vencimiento**, la más próxima arriba, y después
las que no.

| Etiqueta | Qué significa |
|---|---|
| **Vencida el 03/11/2026** (en rojo) | Ya pasó la fecha y la nota sigue pendiente |
| **Hoy** (en amarillo) | Vence hoy |
| **Mañana** o **Vence el 24/12/2026** (en gris) | Todavía tenés tiempo |

## Qué podés hacer con una nota

- **Completarla:** tocá el casillero de la izquierda. La nota se tacha y pasa a **Completadas**.
  Aparece un aviso abajo con **Deshacer**, por si fue sin querer.
- **Editar el texto:** tocá el texto de la nota, cambialo y apretá Enter (o tocá afuera). Con **Esc**
  cancelás el cambio. Si borrás todo el texto, la nota **no se elimina**: se descarta el cambio.
- **Cambiar o quitar el vencimiento:** tocá la etiqueta de fecha, o el menú de los tres puntitos →
  **Cambiar vencimiento** / **Quitar vencimiento**.
- **Eliminarla:** menú de los tres puntitos → **Eliminar**. No te pide confirmación: aparece el aviso
  **Deshacer** unos segundos y la nota vuelve tal cual estaba.

## Aviso cuando una nota vence

Si una nota tiene vencimiento, el sistema te avisa **una vez**, en la **campanita** (con el ícono del
lápiz), cuando llega el día: **"Nota para hoy"** el día del vencimiento, o **"Nota vencida"** si ya
pasó y no la habías completado. Si tenés activadas las notificaciones en el celular, te llega también
como notificación (menú de tu usuario → **Notificaciones en este dispositivo**). Al tocarla vas a
Inicio, donde la tarjeta **Mis notas** muestra primero las vencidas y las de hoy.

Algunas cosas para tener en cuenta:

- **Llega cuando alguien entra a la app**, no a una hora fija: el sistema revisa los vencimientos al
  entrar (como máximo una vez por hora). Si no abrís el sistema ese día, el aviso te espera en la
  campanita para la próxima vez.
- **Avisa una sola vez por nota.** Si la dejás pendiente, no te vuelve a notificar cada día.
- Si **cambiás el vencimiento** de una nota a otro día, vuelve a avisarte cuando llegue la fecha nueva.
- **No te avisa de lo que acabás de escribir.** Si cargás una nota con vencimiento de hoy (o de un día
  que ya pasó), no te llega aviso: acabás de verla. Lo mismo si **reabrís** una nota vencida que habías
  completado.
- No avisa notas **completadas** ni **eliminadas**, ni las que no tienen vencimiento.

## Notas completadas

Debajo de las pendientes hay una sección plegada, **Completadas (N)**. Tocala para verla. Ahí podés:

- **Reabrir** una nota destildando el casillero: vuelve a las pendientes.
- **Eliminarla** definitivamente de tu lista con el tachito.

Se muestran las **últimas 50** completadas.

## Preguntas frecuentes

**¿Otra persona puede ver mis notas?** No. Cada usuario ve únicamente las suyas.

**¿Las veo desde el celular y desde la computadora?** Sí, son las mismas: están asociadas a tu usuario,
no al dispositivo. Si cambiás algo en un lado, en el otro aparece al volver a entrar a la pestaña o al
abrir el panel.

**¿Puedo vincular una nota a un presupuesto, una OCA o un empleado?** Todavía no. Por ahora son notas
sueltas.

<!-- ref: conmomet-app/src/components/notes/QuickNotesProvider.tsx, conmomet-app/src/components/notes/QuickNotesFab.tsx, conmomet-app/src/components/notes/QuickNotesDrawer.tsx, conmomet-app/src/components/notes/QuickNotesWidget.tsx, conmomet-app/src/components/common/NotificationBell.tsx, conmomet-app/src/utils/quickNotes.ts, conmomet-app/src/app/dashboard/layout.tsx, conmomet-app/src/app/dashboard/page.tsx, api_conmomet/controllers/quickNoteController.js, api_conmomet/models/quickNote.js, api_conmomet/helpers/quickNoteEntityTypes.js, api_conmomet/services/expirationNotifier.js, api_conmomet/helpers/argentinaDate.js -->
