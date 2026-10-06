export interface HelpTopic {
  id: string;
  category: string;
  title: string;
  keywords: string[];
  file: string;
}

// Índice de temas de la sección de Ayuda. Se va completando de a un flujo por vez.
// `category` reutiliza los mismos nombres de grupo que ya existen en el menú lateral
// (ver menuGroups en src/app/dashboard/layout.tsx) para que la Ayuda se organice igual
// que el resto de la app.
export const HELP_TOPICS: HelpTopic[] = [
  {
    id: 'crear-oca',
    category: 'Gestión de Clientes',
    title: 'Creación de OCAs (Remitos)',
    keywords: [
      'oca', 'remito', 'remitos', 'presentar', 'aprobar', 'rechazar', 'anular',
      'corregir', 'horas hombre', 'horas grua', 'horas grúa', 'supervisor',
    ],
    file: 'crear-oca.md',
  },
  {
    id: 'carga-horas',
    category: 'Personal',
    title: 'Carga de Horas',
    keywords: [
      'horas', 'carga de horas', 'jornada', 'ingreso', 'egreso', 'llegada tarde',
      'recargo', 'feriado', 'aprobar', 'anular', 'pep', 'concepto', 'mensualizado',
      'quincena', 'supervisor', 'grua', 'grúa',
    ],
    file: 'carga-horas.md',
  },
  {
    id: 'liquidaciones',
    category: 'Contabilidad',
    title: 'Liquidaciones',
    keywords: [
      'liquidacion', 'liquidación', 'quincena', 'sueldo', 'jornalizado', 'mensualizado',
      'confirmar', 'pagar', 'adelanto', 'prestamo', 'préstamo', 'retroactivo', 'pep',
    ],
    file: 'liquidaciones.md',
  },
  {
    id: 'herramientas-reparacion',
    category: 'Pañol',
    title: 'Reparación de Herramientas',
    keywords: [
      'herramienta', 'herramientas', 'reparacion', 'reparación', 'responsable',
      'devolucion', 'devolución', 'pañol', 'aviso', 'notificacion', 'notificación',
    ],
    file: 'herramientas-reparacion.md',
  },
  {
    id: 'herramientas',
    category: 'Pañol',
    title: 'Herramientas',
    keywords: [
      'herramienta', 'herramientas', 'pañol', 'alta', 'tipo de herramienta', 'estado',
      'disponible', 'reservada', 'entregada', 'en reparacion', 'en reparación', 'de baja',
      'extraviada', 'qr', 'codigo', 'código', 'etiqueta',
    ],
    file: 'herramientas.md',
  },
  {
    id: 'asignaciones',
    category: 'Pañol',
    title: 'Asignación de Herramientas y Grúas',
    keywords: [
      'asignacion', 'asignación', 'asignaciones', 'entrega', 'entregar', 'devolucion',
      'devolución', 'devolver', 'reserva', 'reservar', 'responsable', 'condicion',
      'condición', 'completitud', 'grua', 'grúa', 'vehiculo', 'vehículo', 'pañol',
    ],
    file: 'asignaciones.md',
  },
  {
    // Categoría propia a propósito, no coincide con ningún grupo de menú actual: Vehículos hoy
    // vive dentro de "Gestión de Clientes" en el menú, pero va a crecer como módulo
    // independiente de gestión de flota, así que se documenta aparte desde ya.
    id: 'flota',
    category: 'Flota',
    title: 'Grúas y Flota',
    keywords: [
      'grua', 'grúa', 'vehiculo', 'vehículo', 'flota', 'camion', 'camión', 'patente',
      'dominio', 'vtv', 'seguro', 'legajo', 'habilitado para carga de horas',
    ],
    file: 'flota.md',
  },
  {
    id: 'clientes',
    category: 'Gestión de Clientes',
    title: 'Clientes',
    keywords: [
      'cliente', 'clientes', 'razon social', 'razón social', 'activar', 'desactivar',
      'supervisor', 'supervisores', 'tarifa', 'tarifas por rubro', 'contacto', 'obra',
      'administracion', 'administración',
    ],
    file: 'clientes.md',
  },
  {
    id: 'plantas',
    category: 'Gestión de Clientes',
    title: 'Plantas',
    keywords: [
      'planta', 'plantas', 'requisitos', 'habilitaciones', 'documentos', 'vencimiento',
      'direccion', 'dirección',
    ],
    file: 'plantas.md',
  },
  {
    id: 'proyectos',
    category: 'Gestión de Clientes',
    title: 'Proyectos',
    keywords: [
      'proyecto', 'proyectos', 'subproyecto', 'subproyectos', 'supervisor', 'supervisores',
      'presupuesto', 'obra',
    ],
    file: 'proyectos.md',
  },
  {
    id: 'pedidos-cotizacion',
    category: 'Gestión de Clientes',
    title: 'Pedidos de Cotización',
    keywords: [
      'pedido de cotizacion', 'pedido de cotización', 'pedidos de cotizacion',
      'pedidos de cotización', 'pc', 'cotizacion', 'cotización', 'vencimiento',
      'presentacion', 'presentación', 'asignar', 'asignacion', 'asignación', 'responsable',
      'responsables', 'reasignar', 'gerencia', 'gerente', 'margen', 'margenes', 'márgenes',
      'validar', 'validacion', 'validación', 'aviso', 'avisos', 'notificacion', 'notificación',
      'notificaciones', 'push', 'celular', 'telefono', 'teléfono', 'iphone', 'android',
      'pantalla de inicio', 'activar notificaciones',
      'cancelar', 'cancelado', 'flujo', 'circuito', 'diagrama', 'estados', 'proyecto',
      'entregar', 'aprobar', 'rechazar', 'cotizado',
      'comentario', 'comentarios', 'linea de tiempo', 'línea de tiempo', 'historial', 'ver',
    ],
    file: 'pedidos-cotizacion.md',
  },
  {
    id: 'adicionales',
    category: 'Gestión de Clientes',
    title: 'Adicionales',
    keywords: [
      'adicional', 'adicionales', 'urgente', 'urgencia', 'proyecto padre', 'padre', 'subproyecto',
      'codigo', 'código', 'a-2026', 'materiales', 'presupuesto rechazado', 'rechazo',
      'nuevo presupuesto', 'historial de presupuestos', 'sin pedido de cotizacion',
      'sin pedido de cotización',
    ],
    file: 'adicionales.md',
  },
  {
    id: 'bitacora',
    category: 'Gestión de Clientes',
    title: 'Bitácora de proyectos y adicionales',
    keywords: [
      'bitacora', 'bitácora', 'nota', 'notas', 'seguimiento', 'registro', 'fotos', 'foto',
      'celular', 'obra', 'proyecto', 'adicional', 'se compro', 'se compró', 'trabajo realizado',
    ],
    file: 'bitacora.md',
  },
  {
    id: 'presupuestos',
    category: 'Gestión de Clientes',
    title: 'Presupuestos',
    keywords: [
      'presupuesto', 'presupuestos', 'cotizacion', 'cotización', 'mano de obra', 'materiales',
      'importar excel', 'bonificacion', 'bonificación', 'descuento', 'aprobar', 'rechazar',
      'enviar', 'duplicar', 'generar proyecto', 'rubro', 'margen', 'costo', 'proveedor',
      'descargar excel', 'exportar',
    ],
    file: 'presupuestos.md',
  },
  {
    id: 'materiales',
    category: 'Pañol',
    title: 'Materiales y Proveedores',
    keywords: [
      'material', 'materiales', 'catalogo', 'catálogo', 'proveedor', 'proveedores', 'precio',
      'precios', 'costo', 'costos', 'sin especificar', 'kg x ml', 'kg por metro', 'unidad',
      'importar excel', 'plantilla', 'historial de costos',
    ],
    file: 'materiales.md',
  },
  {
    // Categoría propia a propósito, mismo criterio que "Flota": el sistema de documentos es
    // transversal (Empleados, Vehículos, Inicio), no vive en un único grupo de menú.
    id: 'documentacion',
    category: 'Documentación',
    title: 'Documentación y Vencimientos',
    keywords: [
      'documento', 'documentos', 'vencimiento', 'vencimientos', 'renovar', 'renovacion',
      'renovación', 'resolver', 'categoria de documento', 'categoría de documento', 'legajo',
      'alerta', 'alertas', 'vence', 'vencido', 'habilitacion', 'habilitación',
    ],
    file: 'documentacion.md',
  },
];
