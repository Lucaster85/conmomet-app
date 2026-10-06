## ¿Qué es el catálogo de Materiales?

Es la lista de materiales nomenclados de la empresa (ej. "Bulón 1/2 x 1/4", "Eje SAE 1045 Ø 20 mm"),
con su **unidad de medida** y el **costo real** de cada uno. Ese costo no se le muestra al
cliente: se usa para calcular los márgenes de los Presupuestos. Se ubica en
**Pañol → Materiales**.

## Alta de un material

Con **"Nuevo Material"**:

- **Descripción*** y **Unidad***.
- **Kg x mL** (opcional): kilos por metro lineal, útil para ejes, perfiles, etc.
- **Precios por proveedor** (solo con permiso para ver costos): una fila por proveedor, con el
  costo y la moneda (ARS/USD). Un mismo material puede tener un precio distinto con cada
  proveedor. Un proveedor puede quedar **sin precio** (el material lo tiene, pero todavía no se
  sabe cuánto cuesta). El material nuevo arranca con el proveedor **"Sin especificar"**.

Todo costo es **por proveedor**: no existe un costo "general" del material. En la lista se ve el
**mejor precio** (el más bajo) y con cuántos proveedores está cargado.

## Proveedores

El botón **"Proveedores"** abre un ABM rápido (solo el nombre): se pueden agregar, renombrar y
eliminar. También se puede crear un proveedor al vuelo escribiendo su nombre en cualquier
selector de proveedor.

- **"Sin especificar"** es un proveedor de sistema: guarda los costos que no tienen proveedor
  (incluidos los que ya estaban cargados antes de existir esta función). **No se puede editar ni
  eliminar.**
- Al **eliminar** un proveedor se borran sus precios del catálogo, pero el historial se
  conserva y los presupuestos que lo usaron siguen mostrando su nombre.

## Historial de costos

El ícono de reloj muestra cada cambio de precio con la fecha, el **proveedor**, el valor y quién
lo hizo. Solo se registra cuando el precio realmente cambia.

## Importar desde Excel

Botones **"Descargar plantilla modelo"** e **"Importar Excel"**. Columnas: **Descripción,
Unidad, Kg x mL, Proveedor, Costo Unitario y Moneda**. (La plantilla de Presupuestos suma una
columna Cantidad, que acá no existe; si importás un archivo que la trae, se ignora.)
El sistema usa la hoja "Materiales" (si no existe, la primera) y reconoce nombres de columna
parecidos.

- El **mismo material puede repetirse en varias filas, una por proveedor**: se crea un solo
  material con un precio por proveedor.
- Una fila **sin costo** deja al proveedor vinculado al material, sin precio.
- Unidades, proveedores y materiales que no existan se crean; los que existen (sin distinguir
  mayúsculas) se reutilizan. Un proveedor vacío se toma como "Sin especificar".
- Primero se muestra una **previsualización**; recién al confirmar se guarda, todo junto (si
  algo falla, no se guarda nada).

## Quién ve los costos

Sin el permiso de costos se ven los materiales, sus unidades y los **nombres** de los
proveedores, pero no los precios.

<!-- ref: conmomet-app/src/app/dashboard/materials/page.tsx, conmomet-app/src/components/materials/, api_conmomet/controllers/materialController.js, api_conmomet/controllers/materialProviderController.js, api_conmomet/services/materialPriceService.js -->
