## ¿Qué es el Sitio web público?

Es la pantalla donde se editan los **textos, servicios, clientes, datos de contacto y obras** de la página web de la
empresa (la que ve cualquier visitante, sin usuario). Se ubica en el menú **Web → Sitio web público**.

Cada pestaña se muestra según tus permisos: las cuatro primeras las ven quienes tienen el permiso de **Configuración
General**, y **Artículos** quienes pueden ver Artículos. Quien tiene solo uno de los dos ve solo esas pestañas. No hace
falta ningún permiso nuevo.

> **Qué no se edita desde acá:** la estructura de la página (qué secciones tiene y en qué orden), los colores, el
> diseño del fondo, la foto principal y los logos de los clientes. Eso lo define quien administra el sitio y se cambia
> con un pedido, no desde esta pantalla.

Los cambios pueden tardar **hasta 5 minutos** en verse en la web.

## Las pestañas

### Textos de las secciones

Una tarjeta por sección (Inicio, Nosotros, Servicios, Nuestro trabajo, Clientes, Contacto) con sus textos: el
texto chico de arriba, el título, el subtítulo, los botones, los párrafos de «Nosotros», etc.

- **Cada campo arranca con el texto actual del sitio.** Si lo cambiás y guardás, la web muestra el tuyo.
- **Si borrás un campo y guardás, vuelve al texto original.** No hay forma de dejar un campo en blanco.
- **«Volver a los textos originales»** deja todos los campos como estaban; después hay que **Guardar**.
- **«Mostrar esta sección en el sitio»**: si lo apagás, la sección desaparece de la página y también del menú de arriba.
- En el subtítulo de Inicio, lo que escribas entre dos asteriscos sale en **negrita** (`**así**`). En la **frase destacada** de «Nosotros» se resalta además en el color de la marca.

### Servicios y Clientes

Las tarjetas de las secciones «Servicios» y «Clientes».

- **Nuevo servicio / Nuevo cliente** para agregar. Cada servicio lleva un **título**, un **ícono** (se elige de una
  grilla: es exactamente el que se ve en la web) y, si querés, un texto y/o una lista de puntos (uno por línea).
- Cada cliente lleva su nombre y una **sigla** (hasta 8 letras) que se muestra en un círculo. Si ya hay un logo
  cargado en la carpeta de la marca, se anota acá el **nombre del archivo**; si no, queda la sigla.
- **Ordenar**: se arrastran las filas y se guarda el orden.
- **El interruptor** de cada fila lo oculta del sitio **sin borrarlo**. Conviene usarlo en vez de eliminar si es algo
  temporal.
- **Eliminar** lo saca del sitio definitivamente.

### Contacto y enlaces

Dos listas:

- **Datos de contacto**: WhatsApp, teléfonos, email y dirección. Aparecen en la sección «Contacto» (las direcciones no) y en
  la columna *Contacto* del pie. **Un cambio acá se ve en los dos lugares.**
- **Enlaces rápidos del pie**: redes sociales, «Trabajá con nosotros», «Vení a conocernos», etc.

Al cargar un enlace se elige el **tipo** (WhatsApp, teléfono, email, dirección, enlace externo o página del sitio) y se
escribe solo el dato:

| Tipo | Qué se escribe | Ejemplo |
|---|---|---|
| WhatsApp | El número con código de país | `5492262679570` |
| Teléfono | El número, como se escribe normalmente | `(2262) 679570` |
| Email | La dirección | `ventas@miempresa.com` |
| Dirección | La dirección completa (abre Google Maps) | `578 N°1682, Quequén` |
| Enlace externo | La dirección web, **con `https://`** | `https://www.instagram.com/miempresa` |
| Página del sitio | La ruta | `/trabaja-con-nosotros` |

El sistema arma el enlace solo y **rechaza** valores que no correspondan al tipo (un email sin arroba, una web sin `https://`).

El botón **«Traer de Datos de mi empresa»** copia el teléfono, el email y la dirección que figuran en *Datos de mi empresa* y los
agrega como datos de contacto. Se copian una vez y se pueden editar: **si después cambiás esos datos en *Datos de mi empresa*, el
sitio no se entera**. Necesita el permiso de *Datos de mi empresa*.

### Artículos

Las **imágenes de la sección «Nuestro trabajo»** de la web, cada una con su título y descripción. Es la misma pantalla de
Artículos de siempre, ahora como una pestaña más de esta pantalla.

- **Nuevo artículo** sube una imagen; el ícono de lápiz la edita y el de tacho la elimina (también la borra del almacenamiento).
- **Ordenar** abre una ventana para arrastrar las imágenes en el orden en que se muestran en la web.
- Si no hay ningún artículo, la web muestra el mensaje de «Nuestro trabajo» que se edita en la pestaña **Textos de las secciones**.

## La primera vez: «Cargar para editar»

Mientras no hayas cargado nada en una lista, **el sitio muestra los valores originales** y aparece un aviso azul con
la lista de lo que se está mostrando. Tocá **«Cargar para editar»** para copiarlos a la pantalla y poder editarlos,
reordenarlos o ocultarlos.

Hasta que lo hagas, **«Nuevo» está deshabilitado**: si agregaras uno solo, reemplazaría a todos los originales y el resto
desaparecería de la web.

Una vez que cargaste una lista, **manda la tuya**: si ocultás todos los elementos, la sección desaparece de la web en vez
de volver a los originales.

## Preguntas frecuentes

**Cambié un texto y la web sigue igual.** Esperá hasta 5 minutos y recargá la página.

**Quiero cambiar el teléfono.** *Contacto y enlaces* → editá el dato: se actualiza en la sección «Contacto» y en el pie.

**Quiero sacar una sección entera.** *Textos de las secciones* → apagá «Mostrar esta sección en el sitio» en esa tarjeta.

**Quiero agregar una obra a la web.** Pestaña *Artículos* → *Nuevo artículo*.

**Quiero cambiar un color, una foto o el orden de las secciones.** No se hace desde esta pantalla: pedíselo a quien administra el sitio.

**Dice que este ambiente no tiene un sitio web público.** Ese ambiente (por ejemplo, el de demostración) está configurado para
entrar directo al login, sin página web.

<!-- ref: conmomet-app/src/app/dashboard/public-site/page.tsx, conmomet-app/src/components/settings/site/BlockTextsTab.tsx, conmomet-app/src/components/settings/site/ServicesTab.tsx, conmomet-app/src/components/settings/site/ClientsTab.tsx, conmomet-app/src/components/settings/site/LinksTab.tsx, conmomet-app/src/components/settings/site/ArticlesTab.tsx, conmomet-app/src/components/settings/site/ArticleForm.tsx, conmomet-app/src/components/settings/site/ArticleSortModal.tsx, conmomet-app/src/components/settings/site/SiteListSection.tsx, conmomet-app/src/components/settings/IconSelect.tsx, conmomet-app/src/app/site-defaults/route.ts, conmomet-app/src/utils/siteContent.ts, conmomet-app/src/components/public/blocks/resolve.ts, conmomet-app/src/config/landing.ts, conmomet-app/public/brands/conmomet/landing.json, api_conmomet/controllers/siteContentController.js, api_conmomet/models/siteBlockText.js, api_conmomet/models/siteService.js, api_conmomet/models/siteClient.js, api_conmomet/models/siteLink.js -->
