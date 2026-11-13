## Cómo se abre un documento

En cualquier lugar de la app donde veas un archivo adjunto — documentos de empleados y de
vehículos (carnets, seguros, permisos de planta, BTB…), comprobantes de adelantos y préstamos,
facturas, pedidos de cotización y su documentación, presupuestos y su documento firmado, OCAs,
licencias y faltas, costos patronales, entregas de EPP, egresos — al tocar **Ver**, **Ver
archivo** o el nombre del archivo **se abre una ventana con el documento a la vista**. No se
descarga nada a tu computadora ni a tu celular.

- **PDF e imágenes** se ven directamente dentro de la ventana.
- **Word, Excel y PowerPoint** (por ejemplo, un pedido de cotización en `.doc`) también se ven
  en la ventana, a través del visor online de Microsoft Office. Tarda unos segundos en cargar.
  Si no carga, o el archivo es muy pesado, usá el botón **Descargar**.
- **Otros tipos de archivo** (por ejemplo `.csv` o `.zip`) no tienen vista previa: la ventana lo
  avisa y se pueden bajar con **Descargar**.

## Cómo descargarlo

Solo si lo necesitás: en la parte de abajo de la ventana está el botón **Descargar**, que baja
el archivo con su nombre original. En PDF e imágenes también hay **Abrir en pestaña**, útil en el
celular para ver un PDF más grande.

**Abrir en pestaña** genera un link temporal que vence a los pocos minutos y no sirve para
compartir. Si necesitás mandarle el archivo a alguien, descargalo y enviáselo.

Cerrá la ventana con **Cerrar** o con la cruz de arriba a la derecha.

## Si quedás sin ver el documento

- Si el archivo de Word/Excel no aparece, tocá **Descargar**: el visor de Microsoft solo puede
  leer archivos de hasta unos 10 MB y a veces demora.
- Si **Descargar** falla, probá de nuevo; si el mensaje dice que el archivo no existe, hay que
  volver a cargarlo.
- Si la ventana muestra un aviso en rojo al abrir, cerrala y volvé a abrir el archivo: el acceso se
  renueva cada vez que lo abrís.

<!-- ref: conmomet-app/src/components/common/FileViewer.tsx, conmomet-app/src/utils/fileKind.ts, conmomet-app/src/utils/fileService.ts, api_conmomet/controllers/fileController.js -->
