## ¿Qué es la Bitácora?

Es el cuaderno de seguimiento de un **proyecto** o un **adicional**: quien lo encarga va dejando notas como
*"se compró material para tal cosa"* o *"se hizo tal trabajo"*, y cada nota queda registrada con **fecha, hora
y autor**. Sirve para reconstruir después qué pasó y cuándo, sin depender de la memoria ni de mensajes sueltos.

Está pensada para cargarse **desde el celular** (en la obra) tanto como desde la computadora.

## Dónde está

- En la ficha de un **proyecto**: pestaña **Bitácora** (en el celular, el ícono "Bitácora").
- En la ficha de un **adicional** (Gestión de Clientes → Adicionales): sección **Bitácora**. Es la misma
  bitácora del proyecto del adicional.

## Agregar una nota

1. Escribí la nota en el campo **"Nueva nota"** (podés usar varias líneas).
2. Si querés, tocá **"Agregar foto"**: en el celular podés sacarla en el momento o elegirla de la galería.
   Se pueden sumar hasta **8 fotos** por nota, y también se puede cargar una nota que sea **solo fotos**
   (por ejemplo, el ticket de una compra).
3. Tocá **"Agregar nota"**.

**La fecha y la hora se registran solas** (no se escriben) y el autor es el usuario que la cargó. Las fotos se
achican automáticamente antes de subirse, para gastar menos datos del celular.

## Leer la bitácora

Las notas se ven **de la más nueva a la más vieja**, agrupadas por día ("Hoy", "Ayer", y después la fecha), cada
una con su hora y su autor. Tocá una foto para verla en grande (con un enlace para abrir la original). Si hay
muchas notas, el botón **"Cargar notas anteriores"** trae las más viejas.

## Las notas no se editan ni se borran

La bitácora es un **registro de solo agregar**: una vez cargada, una nota no se puede modificar ni eliminar.
Esto es a propósito, para que el registro sea confiable. **Si te equivocaste, agregá una nota nueva** que lo
aclare.

## Permisos

La Bitácora tiene sus propios permisos (**project_logs_***), independientes de los de Proyectos y Adicionales:
- Con **lectura** se ve la bitácora.
- Con **escritura** se pueden agregar notas.

Así quien encarga un proyecto o un adicional puede llevar su bitácora sin necesidad de acceso a más pantallas.

<!-- ref: conmomet-app/src/components/projects/ProjectLogPanel.tsx, conmomet-app/src/utils/imageResize.ts, conmomet-app/src/app/dashboard/projects/[id]/page.tsx, conmomet-app/src/app/dashboard/additionals/[id]/page.tsx, api_conmomet/controllers/projectLogController.js -->
