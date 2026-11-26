## ¿Qué son las Consultas web?

Es la bandeja donde llega **todo lo que escribe un visitante en el formulario "Contactanos"** de la
página web de la empresa. Se ubica en **Gestión de Clientes → Consultas web**.

Antes, esos mensajes se intentaban mandar por mail y, como hoy no hay un servidor de mails
funcionando, **se perdían**. Ahora cada consulta **se guarda en el sistema** y le avisa al equipo
dentro de la app: no hace falta que nadie revise una casilla de correo.

## Qué completa el visitante

- **Motivo** (obligatorio): *Pedido de presupuesto*, *Consulta general*, *Proveedores* u *Otro*.
- **Nombre** y **mensaje** (obligatorios) y, opcionalmente, la **empresa**.
- **Teléfono y/o email**: tiene que dejar **al menos uno** para que se le pueda responder.

El formulario no permite adjuntar archivos. Una consulta **no se convierte sola** en Cliente ni en
Pedido de Cotización: es solo el registro de lo que escribieron. Si es un pedido de presupuesto
real, se carga a mano como Pedido de Cotización (ver ese tema).

## Cómo te enteras de que llegó una

Cuando entra una consulta se avisa **a todas las personas con acceso a Consultas web**, de dos formas:

- En la **campanita** (y, si activaste las notificaciones, también en el celular). Al tocarla se abre
  la consulta directamente.
- En el **inicio**, con la tarjeta **"Consultas web sin atender"**, que se mantiene mientras la
  consulta siga **nueva** (ver el tema **Avisos del inicio y campanita**).

## Atender una consulta

Con el botón del ojo se abre el **detalle**. Ahí ves lo que escribió el visitante y tenés accesos
rápidos:

- **Llamar**: abre el marcador del teléfono.
- **WhatsApp**: abre una conversación con un saludo ya escrito (lo mandás vos apretando "enviar").
- **Email**: se muestra como texto con un botón para **copiarlo**, para pegarlo en tu correo.

Las **notas internas** son para el equipo (a quién se derivó, qué se habló) y el visitante nunca las ve.
**Lo que escribió el visitante no se puede editar.**

## Estados

| Estado | Qué significa |
|---|---|
| **Nueva** | Llegó y nadie la tomó. Es la que aparece en el aviso del inicio. |
| **En curso** | Alguien la tomó (**Tomar consulta**). Queda registrado quién y cuándo. |
| **Cerrada** | Ya está resuelta (**Cerrar consulta**). Queda registrado quién y cuándo. |

Una consulta cerrada se puede **reabrir**. Por defecto el listado **oculta las cerradas**: para verlas,
activá **"Ver terminados"**. Se puede filtrar por motivo y por estado, y buscar por nombre, empresa,
email, teléfono o parte del mensaje.

## Eliminar

El botón **Eliminar** (solo con ese permiso) saca la consulta del listado y del aviso del inicio.
Usalo para **spam o duplicadas**; si simplemente ya se atendió, conviene **cerrarla**.

## Protección contra spam

El formulario público tiene dos defensas automáticas: un **tope de envíos** (5 cada 15 minutos desde la
misma conexión) y un **campo oculto** que solo completan los programas automáticos. Si una persona real
supera el tope le aparece un aviso para volver a intentar en unos minutos. Los envíos detectados como
automáticos se descartan sin guardarse.

## ¿Y el mail?

**El envío por mail está apagado.** Cuando haya un servidor de mails funcionando se puede prender con una
configuración del servidor, sin cambiar nada de esta pantalla. Mientras tanto, esta bandeja y los avisos
son la única vía.

## Permisos

- **Consultas web — ver**: entrar a la bandeja y recibir los avisos.
- **Consultas web — modificar**: tomar, cerrar, reabrir y anotar.
- **Consultas web — eliminar**: borrar.

No hay permiso para "crear": las consultas solo se crean desde la página web.

<!-- ref: conmomet-app/src/app/dashboard/contact-inquiries/page.tsx, conmomet-app/src/components/public/ContactForm.tsx, conmomet-app/src/components/public/blocks/ContactBlock.tsx, conmomet-app/src/components/common/ContactInquiryAlert.tsx, conmomet-app/src/utils/contactInquiries.ts, api_conmomet/controllers/contactController.js, api_conmomet/controllers/contactInquiryController.js, api_conmomet/middlewares/publicForm.js, api_conmomet/models/contactInquiry.js -->
