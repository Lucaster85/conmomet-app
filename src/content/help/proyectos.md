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

## Subproyectos

Un proyecto puede tener **subproyectos** (adicionales de obra), que se ven anidados dentro del
proyecto raíz — por eso un subproyecto **no tiene** su propia pestaña de "Adicionales" (no se
admiten más de 2 niveles). Normalmente nacen al aprobar un Presupuesto marcado como "adicional
de" un proyecto existente, pero **no hace falta esperar a que esté aprobado**: si el Presupuesto
del adicional todavía está en **Borrador**, ya se puede usar el botón "Generar Proyecto" desde
ahí (ver el tema **Presupuestos**) — así se puede empezar a cargar horas mientras se termina de
definir el presupuesto formal. Mientras el presupuesto siga en borrador, cada vez que se guarde
se actualizan las bolsas de horas por rubro del proyecto con lo que traiga en ese momento.

## Asignar Supervisores del Cliente

Dentro de la ficha de un proyecto hay una sección **"Asignación de Supervisores"**: se eligen,
como chips, los Supervisores ya cargados para el cliente de ese proyecto (ver el tema
**Clientes**). Si el cliente todavía no tiene ningún supervisor cargado, el sistema lo avisa y
pide configurarlos primero desde la sección Clientes.

Esta asignación es la que habilita, más adelante, cargar horas **PEP OCA/PEP Regular** con ese
supervisor en **Carga de Horas** (ver ese tema para el detalle) — sin un supervisor asignado al
proyecto, esa opción no aparece.

<!-- ref: conmomet-app/src/app/dashboard/projects/page.tsx, conmomet-app/src/app/dashboard/projects/[id]/page.tsx, api_conmomet/controllers/projectController.js, api_conmomet/services/projectFactory.js -->
