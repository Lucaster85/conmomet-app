## ¿Qué es el módulo de Clientes?

Es donde se gestionan los clientes de la empresa. Se ubica en **Gestión de Clientes →
Clientes**. Desde la ficha de cada cliente también se administran sus **Supervisores** y sus
**Tarifas por Rubro** (ver más abajo).

## Alta y edición de un cliente

Con el botón **"Nuevo Cliente"**:

- **Razón Social*** (obligatorio).
- **Email*** (obligatorio, con formato válido).
- **Teléfono** (opcional).
- **CUIT** (opcional): se escribe con o sin guiones y el formulario lo muestra como
  `XX-XXXXXXXX-X`. Tiene que tener **11 dígitos** y el último (el **dígito verificador**) tiene
  que coincidir: si no, el sistema avisa y no deja guardar. Se guarda sin guiones.
- **Condición frente al IVA** (opcional): Responsable Inscripto, Monotributo, IVA Exento,
  Consumidor Final o IVA No Responsable.
- **Opción de transferencia de la FCE** (opcional): **SCA** o **ADC**. Es la que se usa al emitirle una **Factura de Crédito
  Electrónica** a este cliente. Algunos clientes piden una en particular (por ejemplo, ADC). Sin elegir, se usa la de la empresa
  (Datos de mi empresa).
- **Domicilio comercial fiscal** (opcional): calle y número, localidad y provincia. Es el que figura en
  el padrón de ARCA, que puede **no coincidir** con el de la obra o el de la orden de compra. Sale en el
  bloque del cliente de la factura.

El CUIT y la condición de IVA son los **datos fiscales** del cliente. No son obligatorios, pero
conviene cargarlos: es lo que usa **Facturación** para identificar a quién se le factura. Para
**emitir una Factura A por ARCA** son **obligatorios**: el CUIT tiene que ser válido y la condición de
IVA tiene que ser Responsable Inscripto o Monotributo. Se ven en el listado de clientes y
se puede **buscar un cliente por su CUIT**, con o sin guiones. El CUIT no es único: si un mismo
cliente está cargado dos veces (por ejemplo, una por planta), puede repetirse.

### Buscar un cliente en ARCA por su CUIT

Al lado del CUIT hay un botón **Buscar en ARCA**: con un CUIT válido consulta el padrón de ARCA y completa
lo que encuentra: la **razón social** (solo si todavía está vacía), el **domicilio fiscal** (calle, localidad y
provincia, solo si están vacíos) y la **condición frente al IVA** cuando el padrón la informa sin ambigüedad
(monotributo o IVA). Nunca pisa lo que ya escribió una persona, y avisa qué completó, si la clave figura inactiva y
si **ya existe otro cliente con ese CUIT**. Después de buscar, **revisá los datos antes de guardar**.

Para usarlo, quien lo usa necesita permiso de modificar clientes, y el servicio **"ws_sr_padron_a13"** tiene que estar
autorizado para el certificado en ARCA (el mismo trámite que se hizo para facturar, ver el tema **Datos de mi empresa y
conexión con ARCA**). Si no está autorizado, la pantalla lo dice.

## Desactivar un cliente

El ícono de activar/desactivar en el listado **nunca borra** al cliente, solo cambia si está
activo. Un cliente **inactivo** simplemente deja de aparecer como opción en los selectores de
otros módulos (OCAs, Presupuestos, Proyectos, Plantas) — se puede reactivar en cualquier
momento desde el mismo listado, sin perder nada de su historial.

## Supervisores del Cliente

Se crean y editan desde la ficha del cliente (ícono **"Supervisores"**) — no tienen una página
propia en el menú. Campos:

- **Nombre*** y **Apellido*** (obligatorios).
- **Email**, **Teléfono** (opcionales).
- **Tipo de contacto**: **Obra** o **Administración**. Es solo una convención para saber quién
  hace qué: el contacto de **Obra** es quien aprueba los remitos/OCAs (ver el tema **Creación
  de OCAs**); el de **Administración** es quien aprueba el Presupuesto (ver el tema
  **Presupuestos**). El sistema no impide elegir cualquiera de los dos en cualquiera de esas dos
  aprobaciones — es una guía, no una restricción dura.
- Switch **Activo/Inactivo**.
- A diferencia del cliente, un supervisor **sí se puede eliminar** de verdad (con confirmación).

**Dónde se usan**: un supervisor no se asigna a un proyecto desde acá. Se crea acá (queda
asociado al cliente), y **se asigna a un Proyecto puntual desde la ficha de ese Proyecto**
(sección "Asignación de Supervisores" — ver el tema **Proyectos**). Si un cliente todavía no
tiene ningún supervisor cargado, esa sección del proyecto lo va a avisar y va a pedir cargarlos
acá primero.

## Tarifas por Rubro

Ícono **"Tarifas por rubro"** en la ficha del cliente (solo visible si tenés permiso para ver
precios de presupuestos). Es la tarifa de mano de obra que ese cliente en particular paga por
cada rubro (ej. "Hs Grúa"), y sirve como **valor sugerido al armar un Presupuesto** para ese
cliente — el valor sigue siendo editable línea por línea, esto es solo el punto de partida.

Si el rubro que necesitás todavía no existe en el catálogo, el botón **"+"** (arriba del
listado, solo con permiso para administrar rubros) abre un alta rápida sin salir de este
diálogo — mismos campos que el ABM completo de **Configuración → Rubros de Presupuesto**
(nombre, tipo de unidad, etiqueta, orden, activo).

No hace falta cargarlas siempre a mano acá: **se actualizan solas** cada vez que alguien edita
el valor unitario de una línea de mano de obra en un Presupuesto de ese cliente (incluso en
borrador). Este diálogo es la forma de **verlas y corregirlas** manualmente, y tiene un botón
**"Historial"** con el registro de todos los cambios (monto, moneda, fecha y quién lo hizo) —
es un historial que no se puede borrar.

Es un concepto totalmente aparte de la tarifa que se carga en una OCA de Horas Hombre — son dos
precios independientes que no se mezclan.

<!-- ref: api_conmomet/services/arca/padron.js, api_conmomet/controllers/clientController.js, conmomet-app/src/app/dashboard/clients/page.tsx, conmomet-app/src/app/dashboard/clients/ClientForm.tsx, conmomet-app/src/app/dashboard/clients/ClientSupervisorsDialog.tsx, conmomet-app/src/app/dashboard/clients/ClientItemRatesDialog.tsx, api_conmomet/controllers/clientController.js, api_conmomet/helpers/cuit.js, conmomet-app/src/utils/cuit.ts, api_conmomet/controllers/clientSupervisorController.js, api_conmomet/controllers/clientItemRateController.js, api_conmomet/controllers/budgetItemTypeController.js -->
