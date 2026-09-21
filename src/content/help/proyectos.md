## ¿Qué es el módulo de Proyectos?

Es donde vive cada obra/proyecto de la empresa. Se ubica en **Gestión de Clientes → Proyectos**.
Un proyecto puede crearse a mano acá, o nacer automáticamente al **generar el proyecto desde un
Presupuesto aprobado** (ver el tema **Presupuestos**) — en ese caso ya viene con cliente, planta
y horas presupuestadas precargadas.

## Subproyectos

Un proyecto puede tener **subproyectos** (adicionales de obra), que se ven anidados dentro del
proyecto raíz. Normalmente nacen solos al aprobar un Presupuesto marcado como "adicional de" un
proyecto existente — no hace falta crearlos a mano.

## Asignar Supervisores del Cliente

Dentro de la ficha de un proyecto hay una sección **"Asignación de Supervisores"**: se eligen,
como chips, los Supervisores ya cargados para el cliente de ese proyecto (ver el tema
**Clientes**). Si el cliente todavía no tiene ningún supervisor cargado, el sistema lo avisa y
pide configurarlos primero desde la sección Clientes.

Esta asignación es la que habilita, más adelante, cargar horas **PEP OCA/PEP Regular** con ese
supervisor en **Carga de Horas** (ver ese tema para el detalle) — sin un supervisor asignado al
proyecto, esa opción no aparece.

<!-- ref: conmomet-app/src/app/dashboard/projects/page.tsx, conmomet-app/src/app/dashboard/projects/[id]/page.tsx, api_conmomet/controllers/projectController.js -->
