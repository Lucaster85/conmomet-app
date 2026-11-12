## El panel de filtros

Casi todos los listados de la app (Proyectos, Presupuestos, Pedidos de Cotización, OCAs,
Carga de Horas, Préstamos, Adelantos, Licencias, Facturación, Herramientas, Vehículos,
Adicionales, Empleados, y varios más) tienen el mismo panel arriba de la tabla: una barra de
búsqueda a ancho completo, y debajo los selects y switches propios de ese listado. Es siempre
el mismo componente, así que una vez que sabés usarlo en un listado, sabés usarlo en todos.

- La **búsqueda** filtra por lo que tenga sentido en ese listado (nombre, código, notas,
  empleado…), nunca por todo a la vez.
- Los **selects** ("Cliente", "Estado", "Empleado", etc.) acotan a una opción puntual. La
  opción vacía siempre dice "Todos los..." — nunca "Todos" sin más.
- El botón **"Limpiar filtros"** aparece solo cuando hay algún filtro activo, y lo saca a todos
  de un toque (incluido el switch, si el listado tiene uno).

## "Ver terminados" / "Ver inactivos" — lo que ya no está vivo se oculta solo

Muchos listados tienen, además, un switch para mostrar lo que ya terminó su ciclo:

- **"Ver terminados"** en listados operativos — Préstamos, Adelantos, Licencias, Presupuestos,
  Pedidos de Cotización, Proyectos, Adicionales, Facturación, Herramientas, Vehículos. Trae de
  vuelta lo cancelado, rechazado o completado (según el listado).
- **"Ver inactivos"** en Empleados, y **"Ver anuladas"** en OCAs y Carga de Horas — mismo switch,
  mismo lugar, pero para el vocabulario propio de cada uno.
- **"Mostrar resueltos"** en el Legajo Virtual (de un Empleado o de un Vehículo) — para los
  vencimientos de documentación que ya se renovaron.

**Por defecto el switch está apagado**, así que el listado arranca mostrando solo lo que importa
en el día a día — nada de buscar entre adelantos cancelados de hace meses para encontrar el
que necesitás ahora.

**Si en vez de prender el switch elegís un estado puntual** en el select de Estado (por
ejemplo, "Cancelado" en Préstamos), ese estado se busca igual aunque el switch esté apagado —
nunca da una lista vacía por eso. Es la regla en todos los listados que tienen ambos controles:
**un estado explícito siempre le gana al switch**.

Nada de lo oculto se borra ni se pierde: sigue estando ahí, un switch de distancia.

<!-- ref: conmomet-app/src/components/common/ListFilters.tsx -->
