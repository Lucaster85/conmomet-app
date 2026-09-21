## ¿Qué es el módulo de Plantas?

Es el registro de las plantas/instalaciones de los clientes donde la empresa trabaja. Se ubica
en **Gestión de Clientes → Plantas**.

## Alta y edición de una planta

- **Nombre*** (obligatorio).
- **Dirección** (con autocompletado).
- **Cliente** al que pertenece.
- **Notas**.
- Switch **Activa**.

## Requisitos de la planta

Ícono **"Requisitos"** en cada planta: define qué categorías de documento son **obligatorias**
o **deseables** para que un empleado pueda entrar a trabajar ahí (ej. curso de altura, ART
vigente). Esto es lo que alimenta la sección de Habilitaciones.

## Habilitaciones

Ícono **"Habilitaciones"**: muestra, para cada empleado, si está **habilitado**, **por vencer**
o **no habilitado** para entrar a esa planta, según los Requisitos configurados arriba y los
documentos que tenga cargados. Se puede expandir cada empleado para ver el detalle documento
por documento.

<!-- ref: conmomet-app/src/app/dashboard/plants/page.tsx, api_conmomet/controllers/plantController.js, api_conmomet/controllers/plantRequirementController.js, api_conmomet/controllers/complianceController.js -->
