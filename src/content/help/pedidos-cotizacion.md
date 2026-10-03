## ¿Qué es un Pedido de Cotización?

Es el registro de que un cliente pidió que le cotizáramos algo, antes de que exista el
Presupuesto en sí. Se ubica en **Gestión de Clientes → Pedidos de Cotización**. Guarda el
documento que mandó el cliente (en cualquier formato — PDF, Word, lo que sea), el **número con
el que el cliente identifica su pedido**, el **vencimiento de presentación** y quién tiene que
armar la cotización. Es un paso previo opcional: un Presupuesto se puede seguir creando directo,
sin pasar por acá.

## Cargar un Pedido de Cotización

Con el botón **"Nuevo Pedido"** (solo visible para quien tiene permiso para asignar Pedidos de
Cotización):

- **Título*** y **Cliente*** (obligatorios), **Planta** (se filtra según el cliente elegido).
- **N° de Cotización del Cliente*** (obligatorio): el número con el que el cliente identifica
  su propio pedido, distinto del código interno nuestro (`PC-AAAA-NNN`) que el sistema genera
  solo. Es **texto libre** porque cada cliente usa su propia nomenclatura, así que no se le
  exige ningún formato. Se carga una sola vez acá: los Presupuestos que salgan de este pedido lo
  muestran tomándolo de acá, no hay que volver a escribirlo.
- **Descripción** y **Fecha de recepción** (cuándo lo mandó el cliente).
- **Vencimiento de presentación*** (obligatorio) — hasta cuándo hay tiempo de mandarle la
  cotización al cliente. Es el dato más importante del módulo: se ve siempre, como un cartel de
  color que indica cuántos días quedan (o hace cuántos días que venció). Es solo una alerta
  visual — vencido igual se puede seguir trabajando con normalidad, no bloquea nada.
- **Responsables**: una o más personas que van a armar el presupuesto. Se puede elegir más de
  una.
- **Adjuntar documento**: el o los archivos que mandó el cliente, en cualquier formato.

## El recorrido completo, de un vistazo

Desde que entra el pedido del cliente hasta que se genera el Proyecto:

```
       GERENCIA carga el Pedido de Cotización
       (documento del cliente, N° del cliente,
        vencimiento y responsables)
                    |
                    v
          +--------------------+
          |     PENDIENTE      |
          +--------------------+
                    |  el responsable aprieta
                    |  "Crear presupuesto"
                    v
          +--------------------+
          |    EN PROGRESO     | <-------------+
          +--------------------+               |
                    |                          |
                    |  el responsable carga    |  "Devolver al
                    |  rubros y materiales     |   responsable"
                    |  (presupuesto: BORRADOR) |
                    |                          |
                    |  "Entregar a gerencia"   |
                    v                          |
          +--------------------+               |
          |     A VALIDAR      | --------------+
          +--------------------+
                    |  gerencia carga los márgenes,
                    |  revisa y aprieta "Enviar"
                    v
          +--------------------+
          |      COTIZADO      |   presupuesto: ENVIADO
          +--------------------+
                    |
                    |  responde el cliente
            +-------+--------+
            v                v
        APROBADO         RECHAZADO
            |                |
            |                +--> "Duplicar" para rehacerlo:
            |                     el pedido vuelve a EN PROGRESO
            |
            |  "Generar Proyecto"
            v
     +--------------------+
     |      PROYECTO      |
     +--------------------+
```

**Cancelar** está disponible en cualquier punto antes de Cotizado, y un pedido cancelado se
puede reabrir después.

## El ida y vuelta entre responsable y gerencia

Un Pedido de Cotización pasa por estos estados:

**Pendiente** → **En progreso** → **A validar** → **Cotizado**, con **Cancelado** disponible en
cualquier punto del camino.

- Apenas se crea queda **Pendiente**, con sus responsables ya avisados (ver más abajo).
- Desde el Pedido de Cotización se puede ir directo a **"Crear presupuesto"**: abre el alta de
  Presupuestos con el cliente y la planta ya precargados. Al guardarlo, el pedido pasa solo a
  **En progreso** — ya no hace falta tocar nada acá, se sigue cargando el presupuesto como
  siempre (ver el tema **Presupuestos**): rubros de mano de obra, materiales, cantidades.
- Cuando el presupuesto ya tiene todo lo operativo cargado, el responsable usa
  **"Entregar a gerencia"**. El botón está **en el módulo de Presupuestos**, en la fila del
  presupuesto — que es donde se estuvo trabajando — y también en el listado de Pedidos de
  Cotización, por si se prefiere entrar por ahí. Se elige quién de gerencia lo recibe (solo
  aparecen en la lista quienes pueden gestionar pedidos) y el pedido pasa a **A validar**. Es el
  momento en el que gerencia carga los márgenes de los materiales y, si hace falta, las horas de
  mano de obra, y revisa que el presupuesto esté bien antes de mandarlo al cliente (eso se sigue
  haciendo desde el Presupuesto en sí, con el permiso correspondiente para ver y cargar precios).
  **El responsable no puede enviar el presupuesto al cliente**: ese botón requiere un permiso
  aparte que normalmente solo tiene gerencia, así que su trabajo termina al entregarlo.
- Si gerencia necesita que se corrija algo, usa **"Devolver al responsable"**: vuelve a **En
  progreso**, con la posibilidad de reasignarlo a otra persona si hace falta.
- **Cotizado no se marca a mano**: el pedido pasa solo a ese estado en cuanto el presupuesto
  vinculado se manda al cliente (botón **"Enviar"** en Presupuestos, que normalmente solo puede
  usar gerencia). Así **Cotizado** siempre significa que la cotización efectivamente salió, y no
  puede quedar un pedido dado por cerrado con el presupuesto todavía en Borrador. Si al final se
  decide no cotizar, el camino es **Cancelar**.
- Si más adelante hay que **volver a cotizar sobre el mismo pedido** (por ejemplo, el cliente
  rechazó el presupuesto y se duplica para rehacerlo manteniendo el vínculo), el pedido **vuelve
  solo a En progreso** y reaparece en los avisos.
- **Cancelar** se puede hacer en cualquier momento antes de llegar a Cotizado, y un pedido
  cancelado se puede **reabrir** después si hace falta retomarlo.

Cada Pedido de Cotización lleva **un presupuesto a la vez**: apenas se crea el primero, el botón
**"Crear presupuesto"** desaparece y en su lugar queda el acceso directo al presupuesto ya
generado. Vuelve a aparecer en dos casos: si el presupuesto se **rechaza** (ahí se puede volver a
cotizar — lo más práctico suele ser **Duplicar** el rechazado, ver el tema **Presupuestos**) o si
se **elimina** mientras todavía estaba en Borrador. El presupuesto rechazado se sigue viendo en
la fila del pedido, marcado en rojo, para no perder el historial.

## Después de cotizar: aprobación y Proyecto

Una vez que el presupuesto se envió, el pedido ya figura como **Cotizado** y la pelota pasa al
cliente. Lo que sigue se maneja desde el módulo de **Presupuestos** (ver ese tema para el
detalle):

- Si el cliente **aprueba**, se registra la aprobación en el presupuesto: se puede dejar
  asentado qué contacto del cliente lo aprobó y subir el documento firmado (se puede subir
  después también, no frena nada). Con el presupuesto en **Aprobado** aparece el botón
  **"Generar Proyecto"**, que crea el Proyecto real y lo deja vinculado. A partir de ahí se
  carga el trabajo contra ese proyecto: horas, materiales, OCAs.
- Si el cliente **rechaza**, hay que dejar el motivo. Rechazado es un estado final del
  presupuesto: para rehacerlo se usa **"Duplicar"**, y si el duplicado se mantiene vinculado al
  mismo pedido, ese pedido **vuelve solo a En progreso** para que el circuito arranque otra vez.

Hay una excepción conocida en el paso al Proyecto: si el presupuesto es **un adicional de** un
proyecto que ya existe, se puede generar el subproyecto **sin esperar la aprobación**, estando
todavía en Borrador. Sirve para cuando hay que empezar a trabajar antes de tener cerrado el
alcance. Está explicado en el tema **Presupuestos**.

## Avisos

Cargar un Pedido de Cotización nuevo, y cada vez que se reasigna en el ida y vuelta con
gerencia, genera un aviso en el **Inicio** de la persona asignada — separado según si le toca
armar el presupuesto o validarlo. Por ahora el aviso es solo dentro de la app (no llega como
notificación al celular todavía).

## Quién puede hacer qué

- **Gerencia** (quien gestiona pedidos): carga el pedido, lo edita, elige y cambia
  responsables, lo devuelve al responsable, lo marca como cotizado, lo cancela o lo reabre. Es
  también quien **envía el presupuesto al cliente**.
- **Responsable de cotizar**: ve los pedidos que tiene asignados, arma el presupuesto y lo
  **entrega a gerencia**. No puede editar el pedido (ni cambiarle el vencimiento ni
  reasignarlo), ni enviarle el presupuesto al cliente — su trabajo termina al entregarlo.

<!-- ref: conmomet-app/src/app/dashboard/quote-requests/page.tsx, conmomet-app/src/components/common/QuoteRequestAlert.tsx, conmomet-app/src/components/common/DeliverToManagementDialog.tsx, api_conmomet/controllers/quoteRequestController.js, api_conmomet/controllers/budgetController.js -->
