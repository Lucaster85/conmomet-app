## ¿Qué es Grúas y Flota?

Es la gestión de las grúas, camiones y utilitarios de la empresa: alta, estado, y documentación
(seguros y VTV). Hoy se ubica en **Gestión de Clientes → Vehículos / Flota** dentro del menú,
aunque acá la agrupamos aparte porque a futuro va a crecer como un módulo propio de gestión de
flota.

## Alta de un vehículo

- **Patente/Dominio*** — se guarda en mayúsculas, y no puede repetirse: si ya existe un
  vehículo con esa patente, el sistema lo avisa.
- **Marca**, **Modelo** — opcionales.
- **Tipo*** — Grúa, Camión, u Otro/Utilitario.
- **"Habilitado para Carga de Horas"** (switch): si está apagado, el vehículo no aparece como
  opción al cargar horas de grúa en **Carga de Horas**.

## Los estados de un vehículo

- **Disponible**, **Reservada**, **Entregada**, **En reparación**, **De baja** — los mismos
  conceptos que en Herramientas. A diferencia de las herramientas, acá **no existe el estado
  "Extraviada"**.

## Cambiar el estado

Igual que con las herramientas: se puede cambiar a cualquier estado **excepto "Entregada"**, que
solo lo maneja el flujo de Asignaciones (ver el tema **Asignación de Herramientas y Grúas**).

Una diferencia importante con las herramientas: cuando un vehículo pasa a **"En reparación"**
(a mano o al registrar una devolución), **no se le asigna ningún responsable ni se genera
ningún aviso** — es así a propósito, todavía no está contemplado para vehículos.

## Legajo Digital

Desde la ficha del vehículo, el botón **"Legajo Digital"** abre la gestión de su documentación:
seguros y habilitación VTV. Para el detalle de cómo cargar, renovar o resolver esos documentos,
ver el tema **Documentación y Vencimientos**.

## Ficha del vehículo y código QR

Igual que las herramientas: la ficha muestra el historial completo de cambios de estado, y
tiene un código QR imprimible que lleva directo a esa ficha al escanearlo.

<!-- ref: conmomet-app/src/app/dashboard/vehicles/page.tsx, api_conmomet/controllers/vehicleController.js -->
