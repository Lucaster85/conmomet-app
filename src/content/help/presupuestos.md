## ¿Qué es el módulo de Presupuestos?

Es donde se arman las cotizaciones para un cliente: mano de obra, materiales, y el ciclo de
aprobación. Se ubica en **Gestión de Clientes → Presupuestos**. Un Presupuesto aprobado puede
convertirse en un Proyecto real (ver más abajo).

## Crear un presupuesto

Con el botón **"Nuevo Presupuesto"**:

- **Título*** y **Moneda** (ARS/USD).
- **Relación con un proyecto** — define qué pasa cuando se apruebe:
  - Vacío: es para un **proyecto totalmente nuevo**, que se crea al aprobar.
  - **"Es un adicional de"** un proyecto existente: al aprobar, genera un **subproyecto**
    hijo de ese proyecto.
  - **"Vincular a un proyecto ya existente"**: al aprobar **no crea nada nuevo**, reutiliza
    ese proyecto y le actualiza las horas presupuestadas. Un proyecto no se puede vincular a
    dos presupuestos a la vez.
- **Cliente*** (obligatorio) y **Planta** (se filtra según el cliente elegido). Si elegiste
  "adicional" o "vincular" arriba, estos dos campos se completan solos y quedan bloqueados.
- **Descripción**, **Fecha de Inicio/Fin previstas**, **Vigencia (días)** (solo informativo, no
  bloquea nada), **N° de OT** (opcional).

## Líneas de Mano de Obra

Cada línea tiene **Rubro**, **Cantidad**, y — si tenés permiso para ver precios de
presupuestos — **Valor unitario** y **Moneda**. Al elegir un rubro, si la línea todavía no
tiene precio cargado, se **prellena automáticamente** con la Tarifa por Rubro vigente para ese
cliente (ver el tema **Clientes**) — es solo un punto de partida, se puede editar sin problema.

## Líneas de Materiales

Cada línea tiene **Material** (se puede buscar o crear uno nuevo al vuelo sin salir del
formulario), **Cantidad**, **Unidad**, y — con permiso para ver costos — el **costo real** del
material y un **margen %**, con los que se calcula solo el precio al cliente.

**Importante**: un material que todavía no tiene costo cargado en el catálogo **no se puede
presupuestar** — el sistema pide cargarle el costo primero desde el catálogo de Materiales.

### Importar materiales desde Excel

Botones **"Descargar plantilla"** e **"Importar Excel"**. El sistema busca una hoja llamada
"Materiales" dentro del archivo (si no la encuentra, usa la primera hoja) y reconoce las
columnas aunque tengan nombres parecidos (ej. "cant" o "qty" para cantidad). **Esto no guarda
nada por sí solo**: solo trae las filas leídas para previsualizar y agregarlas al formulario,
que después se sigue editando y guardando de la forma normal.

## El ciclo de estados

**Borrador** → **Enviado** → **Aprobado** o **Rechazado**.

- **"Enviar"**: pasa de Borrador a Enviado.
- **"Aprobar"**: opcionalmente se completa quién lo aprobó (un contacto/Supervisor del
  cliente) y se puede subir el documento firmado (o subirlo más adelante). Una vez aprobado, el
  mismo botón sirve para **reemplazar el documento firmado** sin cambiar de estado.
- **"Rechazar"**: pide un **motivo obligatorio**.

**Rechazado es un estado final**: a diferencia de las OCAs, un Presupuesto rechazado no tiene
un botón de "corregir" — la forma de arrancar de nuevo es **Duplicarlo** (ver abajo).

## Bonificación

Botón **"Bonificación"** (solo con permiso para ver precios), disponible únicamente sobre
presupuestos **Enviados** o **Aprobados**. Dos porcentajes independientes — uno para mano de
obra y otro para materiales, entre 0 y 100 — que se aplican sobre los totales, sin tocar las
líneas originales.

## Generar Proyecto

Botón **"Generar Proyecto"**, disponible solo cuando el presupuesto está **Aprobado** y todavía
no generó ninguno. Crea el Proyecto real (nuevo, subproyecto, o el vinculado, según lo elegido
al crear el presupuesto — ver arriba) y lo deja vinculado a este presupuesto. Solo se puede usar
una vez por presupuesto.

## Duplicar

Botón **"Duplicar"**, disponible en cualquier estado. Crea un **Presupuesto nuevo en
Borrador** con el mismo cliente, planta, moneda, fechas y todas las líneas de mano de obra y
materiales — es la forma de volver a cotizar algo parecido, o de rearmar un presupuesto
rechazado desde cero.

## Quién ve precios y costos

El acceso al módulo lo da un permiso general, pero **ver la plata es otro permiso aparte**:

- Sin permiso de **costos**, no se ve el costo real de los materiales.
- Sin permiso de **precios**, no se ven los valores unitarios de mano de obra, ni los precios
  ni márgenes de materiales, ni los totales, ni la Bonificación, ni las Tarifas por Rubro del
  cliente.

Alguien sin ninguno de los dos permisos igual puede hacer todo el trabajo operativo — crear y
editar presupuestos (cargando rubros/cantidades y materiales/cantidades, sin precio),
cambiarles el estado, duplicarlos y generar el proyecto — simplemente no ve los montos.

<!-- ref: conmomet-app/src/app/dashboard/budgets/page.tsx, api_conmomet/controllers/budgetController.js, api_conmomet/services/projectFactory.js -->
