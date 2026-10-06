## ¿Qué es el módulo de Proyectos?

Es donde vive cada obra/proyecto de la empresa. Se ubica en **Gestión de Clientes → Proyectos**.
Un proyecto puede crearse a mano acá, o nacer automáticamente al **generar el proyecto desde un
Presupuesto** (ver el tema **Presupuestos**) — en ese caso ya viene con cliente, planta y horas
presupuestadas precargadas, desglosadas por rubro (ver abajo).

## Horas por Rubro

En la pestaña **Resumen** de la ficha del proyecto, las horas presupuestadas ya no son un único
total: se muestran **desglosadas por rubro** (Montaje, Construcción, etc. — los mismos rubros
que se usan en Presupuestos), cada una con su propia barra de presupuestado vs. cargado. Las
horas que se cargan en **Carga de Horas** sin elegir rubro caen en una bolsa aparte llamada
**"Generales"**, que también se muestra ahí. Abajo de las bolsas por rubro se ve el total propio
y el total consolidado (propio + subproyectos).

Si el presupuesto tenía un **rubro repetido** en varias líneas (ej. dos líneas de Construcción con
precios distintos), las horas de ese rubro se **suman en una sola bolsa**. Si el rubro es **por
días**, las horas cotizadas son **días × 9**: 2 días cotizados aparecen como 18 hs. En la pestaña
**Presupuesto** del proyecto cada línea se ve como "2 días (18 hs)" o "20 hs", con su descripción.

## Adicionales y subproyectos

Los **adicionales** (trabajos urgentes que arrancan sin pedido de cotización ni presupuesto aprobado)
tienen su propio módulo: **Gestión de Clientes → Adicionales** (ver el tema **Adicionales**). Un
adicional es un proyecto más, con o sin proyecto padre, con código **A-AAAA-NNN**.

- El **listado de Proyectos ya no muestra adicionales**: ni los que tienen padre ni los sueltos. Se
  listan solo en Adicionales (los selectores de proyecto de Carga de Horas, OCAs y asignaciones sí
  los incluyen).
- En la ficha de un proyecto, la pestaña **Adicionales** lista los adicionales que dependen de él, como
  **A-2026-001 ↳ P-2026-063**, y su botón **"Nuevo Adicional"** es un **atajo**: abre el alta del módulo
  Adicionales con este proyecto ya puesto como padre. Un adicional no tiene esta pestaña (no se admiten
  más de 2 niveles).
- Si entrás a la ficha de un proyecto que **es un adicional**, arriba aparece un aviso con un enlace
  para ir a su ficha en Adicionales, donde se gestiona (materiales, descripción, padre, presupuesto).
  En un adicional no aparece "Vincular Presupuesto".

Los adicionales anteriores a esta función (**P-2026-063.1**, subproyectos que nacieron de un
Presupuesto "adicional de…") conservan su código y aparecen también en el módulo Adicionales. Si
quedó un **borrador viejo** de ese tipo, sigue generando su subproyecto con el botón "Generar Proyecto"
como antes (ver el tema **Presupuestos**); mientras el presupuesto esté en borrador, cada vez que se
guarde se actualizan las bolsas de horas por rubro del proyecto.

## Bitácora

Cada proyecto tiene una pestaña **Bitácora**, donde se van dejando notas de seguimiento con **fecha, hora y
autor** (y fotos opcionales): qué se compró, qué se hizo. Se carga igual desde el celular que desde la
computadora. Es un registro de solo agregar. Ver el tema **Bitácora de proyectos y adicionales**.

## Asignar Supervisores del Cliente

Dentro de la ficha de un proyecto hay una sección **"Asignación de Supervisores"**: se eligen,
como chips, los Supervisores ya cargados para el cliente de ese proyecto (ver el tema
**Clientes**). Si el cliente todavía no tiene ningún supervisor cargado, el sistema lo avisa y
pide configurarlos primero desde la sección Clientes.

Esta asignación es la que habilita, más adelante, cargar horas **PEP OCA/PEP Regular** con ese
supervisor en **Carga de Horas** (ver ese tema para el detalle) — sin un supervisor asignado al
proyecto, esa opción no aparece.

<!-- ref: conmomet-app/src/app/dashboard/additionals/page.tsx, conmomet-app/src/app/dashboard/projects/page.tsx, conmomet-app/src/app/dashboard/projects/[id]/page.tsx, api_conmomet/controllers/projectController.js, api_conmomet/services/projectFactory.js -->
