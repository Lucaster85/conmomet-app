## ¿Qué es el módulo de Herramientas?

Es el inventario del pañol: cada herramienta física de la empresa (con su propio código de
referencia) queda registrada acá, con su estado actual y su historial. Se ubica en
**Pañol → Herramientas**.

## Alta de una herramienta

Se crea con el botón **"Nueva Herramienta"**:

- **Tipo de herramienta*** — de qué tipo es (ej. "Amoladora", "Soldadora"). Si el tipo que
  necesitás no existe todavía, se puede crear al vuelo escribiendo el nombre y eligiendo la
  opción "Agregar...", sin salir del formulario.
- **Nombre*** — ej. "Soldadora 500A", "Amoladora #1".
- **Código de referencia*** — se carga a mano, no lo genera el sistema. **Importante: no se
  puede editar después de creada la herramienta**, así que conviene revisarlo bien antes de
  guardar.
- **Marca**, **Modelo**, **Número de serie**, **Notas** — todos opcionales.

## Los estados de una herramienta

- **Disponible**: lista para asignarse.
- **Reservada**: ya tiene una asignación reservada, pero todavía no se entregó.
- **Entregada**: está en manos de un responsable/proyecto.
- **En reparación**: fuera de servicio, con un responsable a cargo de la reparación.
- **De baja**: dada de baja del inventario activo.
- **Extraviada**: se perdió o no se sabe dónde está.

## Cambiar el estado

Desde el listado o la ficha de la herramienta, con el botón **"Cambiar estado"**. Se puede pasar
a cualquiera de los estados de arriba **excepto "Entregada"** — ese estado no se elige a mano,
lo pone automáticamente el flujo de **Asignaciones** cuando se confirma una entrega (ver el
tema **Asignación de Herramientas y Grúas**).

Si elegís **"En reparación"**, el sistema te va a pedir elegir un **responsable** de la
reparación — para el detalle de quién puede ser responsable y cómo se entera, ver el tema
**Reparación de Herramientas**.

## Ficha de la herramienta y código QR

Al entrar a una herramienta (o escanear su QR) se ve su información completa: estado actual,
historial de cambios de estado (con quién y cuándo), e historial de asignaciones (a qué
proyecto, con qué responsable, cuándo se entregó y devolvió). Desde ahí también se puede
**imprimir la etiqueta** con el código QR — al escanearlo desde **Pañol → Escanear QR**, lleva
directo a esta ficha.

## Tipos de Herramienta

Es un catálogo simple (**Pañol → Tipos de Herramienta**): cada tipo tiene solo un **Nombre** y
un switch **Activo**. Sirve para agrupar herramientas parecidas (ej. todas las amoladoras).
También se puede crear un tipo nuevo directamente desde el alta de una herramienta, sin tener
que venir a esta pantalla aparte.

## Eliminar una herramienta

Si la herramienta ya tiene asignaciones registradas (entregas/devoluciones), no se puede
eliminar — el sistema lo avisa y sugiere usar el estado **"De baja"** en su lugar, que la saca
de circulación sin perder el historial. Solo se puede borrar sin restricciones una herramienta
que nunca se asignó.

<!-- ref: conmomet-app/src/app/dashboard/tools/page.tsx, conmomet-app/src/app/dashboard/tools/[id]/page.tsx, conmomet-app/src/app/dashboard/tool-types/page.tsx, api_conmomet/controllers/toolController.js -->
